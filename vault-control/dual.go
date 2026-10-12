package main

// Dual Accounts: pair detection and the pair rotation.
//
// The demo pair uses the plain MySQL platform (no rotational group with a dual
// account policy), so the Central Policy Manager changes a password but never
// flips DualAccountStatus. Rotating the Active member breaks the application:
// the Secrets Manager sync keeps the Active username and gets a password that
// changed under it. The rotation is therefore always of the PAIR:
//
//	1. change the password of the Inactive member (Central Policy Manager);
//	2. wait until its lastModifiedTime moves and status is success;
//	3. promote it to Active, then demote the other to Inactive.
//
// A failure or a timeout in step 2 stops before touching the statuses, so the
// application keeps the member it already uses.

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Rotation steps, as the page shows them.
const (
	stepRequested = "solicitada"
	stepChanging  = "trocando_senha"
	stepPromoting = "promovendo"
	stepDone      = "concluida"
	stepFailed    = "falhou"
)

var (
	// cpmTimeout is how long the Central Policy Manager has to confirm the
	// change of the Inactive member (env CPM_TIMEOUT, default 5 minutes).
	cpmTimeout = 5 * time.Minute
	// pollEvery is the interval between account reads while waiting.
	pollEvery = 5 * time.Second
	// maxRotations bounds the in-memory record of rotations.
	maxRotations = 50

	rotStoreMu sync.Mutex
	rotations  = map[string]*rotation{}
	rotOrder   []string
)

func prop(a map[string]any, names ...string) string {
	props, _ := a["platformAccountProperties"].(map[string]any)
	for k, v := range props {
		for _, n := range names {
			if strings.EqualFold(k, n) {
				if s := strings.TrimSpace(fmt.Sprint(v)); s != "" && v != nil {
					return s
				}
			}
		}
	}
	return ""
}

// virtualUser reads VirtualUsername (the spelling the demo Safe uses) or
// VirtualUserName (the spelling in the docs): the lookup ignores case.
func virtualUser(a map[string]any) string { return prop(a, "VirtualUsername") }
func dualStatus(a map[string]any) string  { return prop(a, "DualAccountStatus") }

func isDual(a map[string]any) bool {
	return virtualUser(a) != "" || dualStatus(a) != "" || prop(a, "CurrInd") != ""
}

// findPair returns the Active and the Inactive member of the pair of a, or an
// error code when the Safe does not hold exactly one of each.
func findPair(list []map[string]any, a map[string]any) (active, inactive map[string]any, code string) {
	virtual := virtualUser(a)
	if virtual == "" {
		return nil, nil, "dual_no_virtual_username"
	}
	var members []map[string]any
	seenSelf := false
	for _, x := range list {
		if x["safeName"] != nil && x["safeName"] != safe {
			continue
		}
		if !strings.EqualFold(virtualUser(x), virtual) {
			continue
		}
		if str(x["id"]) == str(a["id"]) {
			x, seenSelf = a, true // the fresh read wins over the list
		}
		members = append(members, x)
	}
	if !seenSelf {
		members = append(members, a)
	}
	if len(members) != 2 {
		return nil, nil, "dual_pair_size"
	}
	for _, m := range members {
		switch {
		case strings.EqualFold(dualStatus(m), "Active"):
			if active != nil {
				return nil, nil, "dual_status_ambiguous"
			}
			active = m
		case strings.EqualFold(dualStatus(m), "Inactive"):
			if inactive != nil {
				return nil, nil, "dual_status_ambiguous"
			}
			inactive = m
		}
	}
	if active == nil || inactive == nil {
		return nil, nil, "dual_status_ambiguous"
	}
	return active, inactive, ""
}

// addPair adds pair, pairTimeline and the latest rotation of the pair to the
// account details. Errors are reported in the answer, never fatal.
func addPair(resp map[string]any, a map[string]any) {
	list, _, _, err := safeAccounts()
	if err != nil {
		resp["pairError"] = "accounts_unavailable"
		return
	}
	act, ina, code := findPair(list, a)
	if code != "" {
		resp["pairError"] = code
		return
	}
	members := []pairMember{}
	for _, m := range []map[string]any{act, ina} {
		vs, verr := versions(str(m["id"]))
		if verr != nil {
			resp["pairTimelineError"] = verr.Error()
		}
		members = append(members, pairMember{ID: str(m["id"]), Name: str(m["name"]), UserName: str(m["userName"]), Status: dualStatus(m), Versions: vs})
	}
	activeInfo := map[string]any{"id": act["id"], "name": act["name"], "userName": act["userName"]}
	if t, src, ok := statusSince(str(act["id"])); ok {
		activeInfo["since"] = t.UTC().Format(time.RFC3339)
		activeInfo["sinceSource"] = src
	}
	resp["pair"] = map[string]any{
		"virtualUserName": virtualUser(a),
		"conjurPath":      "data/vault/" + safe + "/" + virtualUser(a),
		"active":          activeInfo,
		"inactive":        map[string]any{"id": ina["id"], "name": ina["name"], "userName": ina["userName"]},
	}
	resp["pairTimeline"] = mergeTimeline(members, 8)
	if r := latestRotationFor(str(act["id"]), str(ina["id"])); r != nil {
		resp["rotation"] = r
	}
}

// statusSince tells when an account became Active: from a rotation this
// service completed, else from the account activities. Nothing is invented.
func statusSince(id string) (time.Time, string, bool) {
	rotStoreMu.Lock()
	var best time.Time
	for _, r := range rotations {
		if r.Step == stepDone && r.Target.ID == id && r.promotedAt.After(best) {
			best = r.promotedAt
		}
	}
	rotStoreMu.Unlock()
	if !best.IsZero() {
		return best, "rotation", true
	}
	if t, ok := activitySince(id); ok {
		return t, "activities", true
	}
	return time.Time{}, "", false
}

// ---------------------------------------------------------------------------
// Rotation record
// ---------------------------------------------------------------------------

type rotMember struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	UserName string `json:"userName"`
}

type rotStep struct {
	Step string    `json:"step"`
	At   time.Time `json:"at"`
}

// rotation is the public record of one pair rotation (JSON as served).
type rotation struct {
	ID              string     `json:"rotationId"`
	VirtualUserName string     `json:"virtualUserName"`
	Target          rotMember  `json:"target"` // the Inactive member: new password, then Active
	Other           rotMember  `json:"other"`  // the Active member: becomes Inactive
	From            string     `json:"from"`   // userName the application uses before
	To              string     `json:"to"`     // userName it uses after
	Step            string     `json:"step"`
	Steps           []rotStep  `json:"steps"`
	ErrorCode       string     `json:"errorCode,omitempty"`
	Reason          string     `json:"reason,omitempty"`
	CPMTimeoutSec   int        `json:"cpmTimeoutSeconds"`
	Deadline        *time.Time `json:"deadline,omitempty"` // end of the Central Policy Manager wait
	StartedAt       time.Time  `json:"startedAt"`
	FinishedAt      *time.Time `json:"finishedAt,omitempty"`
	ServerTime      time.Time  `json:"serverTime"`

	promotedAt time.Time
}

func newRotationID() string {
	b := make([]byte, 12)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func finished(r *rotation) bool { return r.Step == stepDone || r.Step == stepFailed }

// startRotation records a new rotation unless one of the pair is running.
func startRotation(virtual string, target, other rotMember) (*rotation, *rotation) {
	rotStoreMu.Lock()
	defer rotStoreMu.Unlock()
	for _, r := range rotations {
		if !finished(r) && (r.Target.ID == target.ID || r.Other.ID == target.ID || r.Target.ID == other.ID || r.Other.ID == other.ID) {
			return nil, snapshotLocked(r)
		}
	}
	now := time.Now().UTC()
	r := &rotation{ID: newRotationID(), VirtualUserName: virtual, Target: target, Other: other, From: other.UserName, To: target.UserName,
		Step: stepRequested, Steps: []rotStep{{stepRequested, now}}, CPMTimeoutSec: int(cpmTimeout / time.Second), StartedAt: now}
	rotations[r.ID] = r
	rotOrder = append(rotOrder, r.ID)
	for len(rotOrder) > maxRotations {
		evict := -1
		for i, id := range rotOrder {
			if finished(rotations[id]) {
				evict = i
				break
			}
		}
		if evict < 0 {
			evict = 0
		}
		delete(rotations, rotOrder[evict])
		rotOrder = append(rotOrder[:evict], rotOrder[evict+1:]...)
	}
	return snapshotLocked(r), nil
}

func snapshotLocked(r *rotation) *rotation {
	c := *r
	c.Steps = append([]rotStep(nil), r.Steps...)
	c.ServerTime = time.Now().UTC()
	return &c
}

func getRotation(id string) *rotation {
	rotStoreMu.Lock()
	defer rotStoreMu.Unlock()
	if r, ok := rotations[id]; ok {
		return snapshotLocked(r)
	}
	return nil
}

// latestRotationFor returns the newest rotation of the pair that is running
// or ended in the last 15 minutes.
func latestRotationFor(ids ...string) *rotation {
	rotStoreMu.Lock()
	defer rotStoreMu.Unlock()
	for i := len(rotOrder) - 1; i >= 0; i-- {
		r := rotations[rotOrder[i]]
		for _, id := range ids {
			if r.Target.ID == id || r.Other.ID == id {
				if !finished(r) || (r.FinishedAt != nil && time.Since(*r.FinishedAt) < 15*time.Minute) {
					return snapshotLocked(r)
				}
				return nil
			}
		}
	}
	return nil
}

func setStep(id, step string) {
	rotStoreMu.Lock()
	defer rotStoreMu.Unlock()
	r := rotations[id]
	if r == nil {
		return
	}
	now := time.Now().UTC()
	r.Step = step
	r.Steps = append(r.Steps, rotStep{step, now})
	switch step {
	case stepChanging:
		d := now.Add(cpmTimeout)
		r.Deadline = &d
	case stepDone:
		r.promotedAt = now
		r.FinishedAt = &now
	}
}

func failRotation(id, code, reason string) {
	setStep(id, stepFailed)
	rotStoreMu.Lock()
	if r := rotations[id]; r != nil {
		r.ErrorCode, r.Reason = code, reason
		now := time.Now().UTC()
		r.FinishedAt = &now
	}
	rotStoreMu.Unlock()
	log.Printf("rotation %s failed: %s: %s", id, code, reason)
}

// ---------------------------------------------------------------------------
// Handlers and the worker
// ---------------------------------------------------------------------------

func rotateDual(w http.ResponseWriter, a map[string]any, ip string) {
	list, code, body, err := safeAccounts()
	if err != nil {
		writeErr(w, code, err, body)
		return
	}
	act, ina, perr := findPair(list, a)
	if perr != "" {
		writeJSON(w, http.StatusConflict, map[string]string{"error": perr})
		return
	}
	if act["name"] == selfAccount || ina["name"] == selfAccount {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "self"})
		return
	}
	// fresh baseline of the member whose password changes
	base, code, body, err := getAccount(str(ina["id"]))
	if err != nil {
		writeErr(w, code, err, body)
		return
	}
	lmt, st := management(base)
	target := rotMember{ID: str(ina["id"]), Name: str(ina["name"]), UserName: str(ina["userName"])}
	other := rotMember{ID: str(act["id"]), Name: str(act["name"]), UserName: str(act["userName"])}
	r, running := startRotation(virtualUser(a), target, other)
	if running != nil {
		writeJSON(w, http.StatusConflict, map[string]any{"error": "rotation_in_progress", "rotationId": running.ID, "rotation": running})
		return
	}
	log.Printf("dual rotation %s requested via=%v target=%s other=%s ip=%s", r.ID, a["id"], target.ID, other.ID, ip)
	go runDualRotation(r.ID, target, other, lmt, st)
	writeJSON(w, http.StatusAccepted, map[string]any{"requested": true, "account": a["id"], "dual": true, "rotationId": r.ID, "rotation": r})
}

// rotationStatus serves GET /api/vault/rotations/{rotationId}.
func rotationStatus(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/vault/rotations/")
	if r.Method != http.MethodGet || !validID(id) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	rot := getRotation(id)
	if rot == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unknown_rotation"})
		return
	}
	writeJSON(w, 200, rot)
}

// management returns lastModifiedTime and the status of the last operation.
func management(a map[string]any) (time.Time, string) {
	sm, _ := a["secretManagement"].(map[string]any)
	t, _ := parseEpoch(sm["lastModifiedTime"])
	return t, strings.ToLower(str(sm["status"]))
}

func patchStatus(id, value string) (int, error) {
	ops := []map[string]any{{"op": "replace", "path": "/platformAccountProperties/DualAccountStatus", "value": value}}
	b, code, err := pcloud("PATCH", "/Accounts/"+id+"/", ops)
	if err == nil && code != 200 {
		err = fmt.Errorf("HTTP %d %s", code, upstreamMsg(b))
	}
	return code, err
}

const permHint = `a credencial do vault-control não tem a permissão "Update account properties" no Safe`

func runDualRotation(id string, target, other rotMember, baseLMT time.Time, baseStatus string) {
	defer invalidate(target.ID, other.ID)
	// Preflight: rewrite the Inactive member's status with the value it already has. Nothing
	// changes, but it proves the "Update account properties" permission before the password is
	// touched; otherwise a 403 at promotion time would leave the pair mixed in Conjur.
	if code, err := patchStatus(target.ID, "Inactive"); err != nil {
		if code == http.StatusForbidden {
			failRotation(id, "permission_missing", fmt.Sprintf("%s %s: nenhuma senha foi trocada", permHint, safe))
		} else {
			failRotation(id, "permission_check_failed", fmt.Sprintf("teste de permissão falhou (HTTP %d): nenhuma senha foi trocada", code))
		}
		return
	}
	setStep(id, stepChanging)
	rotStoreMu.Lock()
	deadline := *rotations[id].Deadline
	rotStoreMu.Unlock()

	b, code, err := pcloud("POST", "/Accounts/"+target.ID+"/Change/", map[string]any{})
	if err != nil || (code != 200 && code != 204) {
		msg := upstreamMsg(b)
		if err != nil {
			msg = err.Error()
		}
		failRotation(id, "change_request_failed", fmt.Sprintf("o Privilege Cloud recusou o pedido de troca de %s (HTTP %d %s)", target.UserName, code, msg))
		return
	}
	invalidate(target.ID)

	// A status that was already "failure" only counts once it moved away.
	sawOther := baseStatus != "failure"
	for {
		wait := pollEvery
		if rem := time.Until(deadline); rem < wait {
			wait = rem
		}
		if wait > 0 {
			time.Sleep(wait)
		}
		if a, _, _, gerr := getAccount(target.ID); gerr == nil {
			lmt, st := management(a)
			if !lmt.Equal(baseLMT) && st == "success" {
				break
			}
			if st == "failure" && sawOther {
				failRotation(id, "cpm_failure", fmt.Sprintf("o Central Policy Manager informou falha ao trocar a senha de %s; os status do par não foram alterados", target.UserName))
				return
			}
			if st != "failure" {
				sawOther = true
			}
		}
		if !time.Now().Before(deadline) {
			failRotation(id, "cpm_timeout", fmt.Sprintf("o Central Policy Manager não confirmou a troca em %s", humanDuration(cpmTimeout)))
			return
		}
	}

	setStep(id, stepPromoting)
	invalidate(target.ID)
	if code, err := patchStatus(target.ID, "Active"); err != nil {
		if code == http.StatusForbidden {
			failRotation(id, "promote_forbidden", fmt.Sprintf("%s %s: a senha de %s foi trocada, mas o par não foi promovido", permHint, safe, target.UserName))
		} else {
			failRotation(id, "promote_failed", fmt.Sprintf("não foi possível promover %s a Active (%v)", target.UserName, err))
		}
		return
	}
	if code, err := patchStatus(other.ID, "Inactive"); err != nil {
		// Undo the promotion so exactly one member stays Active: the other
		// member's password did not change, so the application keeps working.
		_, rerr := patchStatus(target.ID, "Inactive")
		undo := "a promoção foi desfeita"
		if rerr != nil {
			undo = "e não foi possível desfazer a promoção: as duas contas estão Active, corrija no cofre"
		}
		if code == http.StatusForbidden {
			failRotation(id, "demote_forbidden", fmt.Sprintf("%s %s ao rebaixar %s; %s", permHint, safe, other.UserName, undo))
		} else {
			failRotation(id, "demote_failed", fmt.Sprintf("não foi possível rebaixar %s a Inactive (%v); %s", other.UserName, err, undo))
		}
		return
	}
	setStep(id, stepDone)
	log.Printf("dual rotation %s done: %s Active, %s Inactive", id, target.UserName, other.UserName)
}

func humanDuration(d time.Duration) string {
	if d >= time.Minute && d%time.Minute == 0 {
		if m := int(d / time.Minute); m == 1 {
			return "1 minuto"
		} else {
			return fmt.Sprintf("%d minutos", m)
		}
	}
	return fmt.Sprintf("%d segundos", int(d.Round(time.Second)/time.Second))
}
