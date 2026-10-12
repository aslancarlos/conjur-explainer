package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

// ---------------------------------------------------------------------------
// A small imitation of the Privilege Cloud API (PasswordVault/API)
// ---------------------------------------------------------------------------

type fakeAcct struct {
	id, name, user string
	props          map[string]any
	lmt            int64 // epoch seconds
	status         string
	versions       []map[string]any
}

type fakeVault struct {
	mu       sync.Mutex
	accts    map[string]*fakeAcct
	order    []string
	onChange string // "success" (after 2 reads), "failure", "never"
	reads    map[string]int
	changed  map[string]bool
	patch    func(id string) int // status for PATCH; nil = 200
	patches  []string            // "id=value" in call order
	changes  []string
	activity string
}

func newFakeVault() *fakeVault {
	f := &fakeVault{accts: map[string]*fakeAcct{}, onChange: "success", reads: map[string]int{}, changed: map[string]bool{}}
	f.add(&fakeAcct{id: "116_3", name: "appuser_db", user: "appuser_db", lmt: 1760270000, status: "success",
		props: map[string]any{"VirtualUsername": "dbuser_dual", "Index": "1", "DualAccountStatus": "Active", "Database": "userdb"},
		versions: []map[string]any{
			{"versionID": 359, "modifiedBy": "PasswordManager", "modificationDate": 1760100000, "isTemporary": false},
			{"versionID": 373, "modifiedBy": "PasswordManager", "modificationDate": "1760270000", "isTemporary": false},
		}})
	f.add(&fakeAcct{id: "116_27", name: "userdb_mariadb", user: "appuser_db_02", lmt: 1760200000, status: "success",
		props: map[string]any{"VirtualUsername": "dbuser_dual", "Index": "2", "DualAccountStatus": "Inactive", "Port": "3306"},
		versions: []map[string]any{
			{"versionID": 3, "modifiedBy": "admin", "modificationDate": 1760000000, "isTemporary": false},
			{"versionID": 5, "modifiedBy": "PasswordManager", "modificationDate": 1760200000, "isTemporary": false},
		}})
	f.add(&fakeAcct{id: "120_1", name: "simple-db", user: "report", lmt: 1760000000, status: "success", props: map[string]any{}})
	return f
}

func (f *fakeVault) add(a *fakeAcct) { f.accts[a.id] = a; f.order = append(f.order, a.id) }

func (a *fakeAcct) json() map[string]any {
	return map[string]any{"id": a.id, "name": a.name, "userName": a.user, "safeName": "dev-demo-aslan", "platformId": "MySQL",
		"platformAccountProperties": a.props,
		"secretManagement":          map[string]any{"automaticManagementEnabled": true, "status": a.status, "lastModifiedTime": a.lmt}}
}

func (f *fakeVault) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if r.Header.Get("Authorization") != "Bearer test-token" {
		w.WriteHeader(401)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/PasswordVault/API")
	send := func(code int, v any) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(code)
		json.NewEncoder(w).Encode(v)
	}
	if path == "/Accounts" && r.Method == "GET" {
		out := []any{}
		for _, id := range f.order {
			out = append(out, f.accts[id].json())
		}
		send(200, map[string]any{"value": out, "count": len(out)})
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(path, "/Accounts/"), "/"), "/")
	a := f.accts[parts[0]]
	if a == nil {
		send(404, map[string]string{"ErrorCode": "PASWS027E", "ErrorMessage": "not found"})
		return
	}
	sub := strings.Join(parts[1:], "/")
	switch {
	case sub == "" && r.Method == "GET":
		f.reads[a.id]++
		if f.changed[a.id] {
			switch f.onChange {
			case "success":
				if f.reads[a.id] >= 2 && a.status != "success-done" {
					a.lmt += 600
					a.status = "success"
					a.versions = append(a.versions, map[string]any{"versionID": len(a.versions) + 100, "modifiedBy": "PasswordManager", "modificationDate": a.lmt})
					f.changed[a.id] = false
				}
			case "failure":
				a.status = "failure"
			}
		}
		send(200, a.json())
	case sub == "Change" && r.Method == "POST":
		f.changes = append(f.changes, a.id)
		f.changed[a.id] = true
		f.reads[a.id] = 0
		w.WriteHeader(200)
	case sub == "" && r.Method == "PATCH":
		var ops []map[string]any
		json.NewDecoder(r.Body).Decode(&ops)
		code := 200
		if f.patch != nil {
			code = f.patch(a.id)
		}
		if code != 200 {
			send(code, map[string]string{"ErrorCode": "PASWS041E", "ErrorMessage": "not authorized"})
			return
		}
		for _, op := range ops {
			if op["path"] == "/platformAccountProperties/DualAccountStatus" {
				a.props["DualAccountStatus"] = op["value"]
				f.patches = append(f.patches, fmt.Sprintf("%s=%v", a.id, op["value"]))
			}
		}
		send(200, a.json())
	case sub == "Secret/Versions" && r.Method == "GET":
		send(200, map[string]any{"versions": a.versions})
	case sub == "Activities" && r.Method == "GET":
		if f.activity == "" {
			send(404, map[string]string{"ErrorCode": "CAWS00001E", "ErrorMessage": "not found"})
			return
		}
		w.Write([]byte(f.activity))
	default:
		send(404, map[string]string{"ErrorMessage": "no route"})
	}
}

func setup(t *testing.T) (*fakeVault, http.Handler) {
	t.Helper()
	f := newFakeVault()
	srv := httptest.NewServer(f)
	t.Cleanup(srv.Close)
	pcloudURL = srv.URL + "/PasswordVault/API"
	safe, selfAccount, allowedOrigin = "dev-demo-aslan", "api-account", "https://demo.minha.cloud"
	tokenSource = func(bool) (string, error) { return "test-token", nil }
	cpmTimeout, pollEvery = 400*time.Millisecond, 20*time.Millisecond
	cacheMu.Lock()
	cache = map[string]cached{}
	cacheMu.Unlock()
	rotMu.Lock()
	rotPerIP, rotCount = map[string]time.Time{}, 0
	rotMu.Unlock()
	rotStoreMu.Lock()
	rotations, rotOrder = map[string]*rotation{}, nil
	rotStoreMu.Unlock()
	return f, newMux()
}

func post(t *testing.T, h http.Handler, path string) (int, map[string]any) {
	t.Helper()
	req := httptest.NewRequest("POST", path, nil)
	req.Header.Set("Origin", "https://demo.minha.cloud")
	req.Header.Set("X-Cofre-Info", "1")
	req.Header.Set("X-Forwarded-For", "203.0.113.9")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	var m map[string]any
	json.Unmarshal(rec.Body.Bytes(), &m)
	return rec.Code, m
}

func get(t *testing.T, h http.Handler, path string) (int, map[string]any) {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("GET", path, nil))
	var m map[string]any
	json.Unmarshal(rec.Body.Bytes(), &m)
	return rec.Code, m
}

// waitEnd polls the status endpoint until the rotation finishes.
func waitEnd(t *testing.T, h http.Handler, id string) map[string]any {
	t.Helper()
	until := time.Now().Add(5 * time.Second)
	for time.Now().Before(until) {
		_, m := get(t, h, "/api/vault/rotations/"+id)
		if s := m["step"]; s == stepDone || s == stepFailed {
			return m
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("rotation did not finish")
	return nil
}

func steps(m map[string]any) []string {
	var out []string
	for _, s := range m["steps"].([]any) {
		out = append(out, s.(map[string]any)["step"].(string))
	}
	return out
}

// ---------------------------------------------------------------------------
// Rotation state machine
// ---------------------------------------------------------------------------

func TestDualRotationChangesInactiveThenPromotes(t *testing.T) {
	f, h := setup(t)
	// ask through the ACTIVE member: the pair rotates, the Inactive one changes
	code, m := post(t, h, "/api/vault/accounts/116_3/rotate")
	if code != 202 || m["dual"] != true || m["rotationId"] == "" {
		t.Fatalf("got %d %v", code, m)
	}
	end := waitEnd(t, h, m["rotationId"].(string))
	if end["step"] != stepDone {
		t.Fatalf("step %v reason %v", end["step"], end["reason"])
	}
	if got := strings.Join(steps(end), ","); got != "solicitada,trocando_senha,promovendo,concluida" {
		t.Fatalf("steps %s", got)
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(f.changes) != 1 || f.changes[0] != "116_27" {
		t.Fatalf("Change must hit only the Inactive member, got %v", f.changes)
	}
	if strings.Join(f.patches, ",") != "116_27=Inactive,116_27=Active,116_3=Inactive" {
		t.Fatalf("permission preflight (no-op), promote, then demote: %v", f.patches)
	}
	if end["target"].(map[string]any)["userName"] != "appuser_db_02" {
		t.Fatalf("target %v", end["target"])
	}
}

func TestDualRotationCPMFailureKeepsStatuses(t *testing.T) {
	f, h := setup(t)
	f.onChange = "failure"
	_, m := post(t, h, "/api/vault/accounts/116_27/rotate")
	end := waitEnd(t, h, m["rotationId"].(string))
	if end["step"] != stepFailed || end["errorCode"] != "cpm_failure" {
		t.Fatalf("got %v %v", end["step"], end["errorCode"])
	}
	if strings.Join(f.patches, ",") != "116_27=Inactive" {
		t.Fatalf("only the no-op preflight on failure, got %v", f.patches)
	}
}

func TestDualRotationTimeout(t *testing.T) {
	f, h := setup(t)
	f.onChange = "never"
	start := time.Now()
	_, m := post(t, h, "/api/vault/accounts/116_3/rotate")
	if m["rotation"].(map[string]any)["cpmTimeoutSeconds"] == nil {
		t.Fatal("timeout must be exposed")
	}
	end := waitEnd(t, h, m["rotationId"].(string))
	if end["step"] != stepFailed || end["errorCode"] != "cpm_timeout" {
		t.Fatalf("got %v %v", end["step"], end["errorCode"])
	}
	if el := time.Since(start); el < cpmTimeout {
		t.Fatalf("gave up after %s, before the %s deadline", el, cpmTimeout)
	}
	if !strings.Contains(end["reason"].(string), "não confirmou a troca em") {
		t.Fatalf("reason %v", end["reason"])
	}
	if end["deadline"] == nil {
		t.Fatal("deadline missing")
	}
	if strings.Join(f.patches, ",") != "116_27=Inactive" {
		t.Fatalf("only the no-op preflight on timeout, got %v", f.patches)
	}
}

func TestTimeoutReasonSaysFiveMinutes(t *testing.T) {
	if got := humanDuration(5 * time.Minute); got != "5 minutos" {
		t.Fatalf("got %q", got)
	}
	if got := humanDuration(400 * time.Millisecond); got != "0 segundos" && got != "1 segundos" {
		// sub-second values only happen in tests
		t.Logf("short duration renders as %q", got)
	}
}

func TestDualRotationPatchForbidden(t *testing.T) {
	f, h := setup(t)
	f.patch = func(string) int { return 403 }
	_, m := post(t, h, "/api/vault/accounts/116_3/rotate")
	end := waitEnd(t, h, m["rotationId"].(string))
	if end["errorCode"] != "permission_missing" {
		t.Fatalf("got %v", end["errorCode"])
	}
	if !strings.Contains(end["reason"].(string), "Update account properties") {
		t.Fatalf("reason must name the permission: %v", end["reason"])
	}
	if f.accts["116_3"].props["DualAccountStatus"] != "Active" || f.accts["116_27"].props["DualAccountStatus"] != "Inactive" {
		t.Fatal("statuses must not change")
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(f.changes) != 0 {
		t.Fatalf("no password may change without the permission, got %v", f.changes)
	}
	if !strings.Contains(end["reason"].(string), "nenhuma senha foi trocada") {
		t.Fatalf("reason must say nothing changed: %v", end["reason"])
	}
}

func TestDualRotationDemoteFailureRollsBack(t *testing.T) {
	f, h := setup(t)
	f.patch = func(id string) int {
		if id == "116_3" {
			return 500
		}
		return 200
	}
	_, m := post(t, h, "/api/vault/accounts/116_3/rotate")
	end := waitEnd(t, h, m["rotationId"].(string))
	if end["errorCode"] != "demote_failed" {
		t.Fatalf("got %v", end["errorCode"])
	}
	if f.accts["116_27"].props["DualAccountStatus"] != "Inactive" || f.accts["116_3"].props["DualAccountStatus"] != "Active" {
		t.Fatalf("promotion must be undone, got %v", f.patches)
	}
}

func TestDualRotationRefusesAmbiguousPair(t *testing.T) {
	f, h := setup(t)
	f.accts["116_27"].props["DualAccountStatus"] = "Active"
	code, m := post(t, h, "/api/vault/accounts/116_3/rotate")
	if code != http.StatusConflict || m["error"] != "dual_status_ambiguous" {
		t.Fatalf("got %d %v", code, m)
	}
	if len(f.changes) != 0 {
		t.Fatal("nothing may be changed")
	}
}

func TestDualRotationRefusesSecondWhileRunning(t *testing.T) {
	f, h := setup(t)
	f.onChange = "never"
	_, first := post(t, h, "/api/vault/accounts/116_3/rotate")
	rotMu.Lock()
	rotPerIP = map[string]time.Time{}
	rotMu.Unlock()
	code, m := post(t, h, "/api/vault/accounts/116_27/rotate")
	if code != http.StatusConflict || m["error"] != "rotation_in_progress" || m["rotationId"] != first["rotationId"] {
		t.Fatalf("got %d %v", code, m)
	}
	waitEnd(t, h, first["rotationId"].(string))
}

func TestSimpleAccountKeepsDirectChange(t *testing.T) {
	f, h := setup(t)
	code, m := post(t, h, "/api/vault/accounts/120_1/rotate")
	if code != 202 || m["dual"] != false || m["rotationId"] != nil {
		t.Fatalf("got %d %v", code, m)
	}
	if len(f.changes) != 1 || f.changes[0] != "120_1" {
		t.Fatalf("changes %v", f.changes)
	}
}

func TestRotateKeepsGuards(t *testing.T) {
	_, h := setup(t)
	req := httptest.NewRequest("POST", "/api/vault/accounts/116_3/rotate", nil)
	req.Header.Set("Origin", "https://evil.example")
	req.Header.Set("X-Cofre-Info", "1")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 403 {
		t.Fatalf("origin check, got %d", rec.Code)
	}
	if code, _ := get(t, h, "/api/vault/rotations/nope"); code != 404 {
		t.Fatalf("unknown rotation, got %d", code)
	}
}

// ---------------------------------------------------------------------------
// Pair detection, history and timeline
// ---------------------------------------------------------------------------

func acct(id, virtualKey, status string) map[string]any {
	return map[string]any{"id": id, "name": id, "userName": "u" + id, "safeName": safe,
		"platformAccountProperties": map[string]any{virtualKey: "dbuser_dual", "DualAccountStatus": status}}
}

func TestFindPairPicksInactiveWithBothSpellings(t *testing.T) {
	safe = "dev-demo-aslan"
	a := acct("1", "VirtualUsername", "Active")
	b := acct("2", "VirtualUserName", "inactive")
	other := map[string]any{"id": "3", "safeName": safe, "platformAccountProperties": map[string]any{}}
	act, ina, code := findPair([]map[string]any{a, b, other}, a)
	if code != "" || act["id"] != "1" || ina["id"] != "2" {
		t.Fatalf("got %v %v %q", act["id"], ina["id"], code)
	}
	// asking through the Inactive member gives the same answer
	act, ina, _ = findPair([]map[string]any{a, b, other}, b)
	if act["id"] != "1" || ina["id"] != "2" {
		t.Fatal("pair must not depend on the member asked")
	}
	if _, _, code := findPair([]map[string]any{a, acct("2", "VirtualUsername", "Active")}, a); code != "dual_status_ambiguous" {
		t.Fatalf("two Active: %q", code)
	}
	if _, _, code := findPair([]map[string]any{a}, a); code != "dual_pair_size" {
		t.Fatalf("lonely member: %q", code)
	}
}

func TestParseEpoch(t *testing.T) {
	want := time.Date(2025, 10, 12, 11, 53, 20, 0, time.UTC)
	for _, v := range []any{float64(1760270000), "1760270000", float64(1760270000000), "2025-10-12T11:53:20Z", json.Number("1760270000")} {
		got, ok := parseEpoch(v)
		if !ok || !got.Equal(want) {
			t.Fatalf("%v: got %v %v", v, got, ok)
		}
	}
	for _, v := range []any{nil, "", 0.0, "x"} {
		if _, ok := parseEpoch(v); ok {
			t.Fatalf("%v should not parse", v)
		}
	}
}

func TestBuildHistoryValidity(t *testing.T) {
	t1, t2, t3 := time.Unix(100, 0).UTC(), time.Unix(200, 0).UTC(), time.Unix(300, 0).UTC()
	h := buildHistory("116_3", "appuser_db", []version{{ID: 373, At: t3}, {ID: 345, At: t1}, {ID: 359, At: t2}})
	if len(h) != 3 || h[0].Version != 373 || !h[0].Current || h[0].ValidUntil != nil {
		t.Fatalf("current first, open window: %+v", h[0])
	}
	if *h[0].ValidFrom != t3.Format(time.RFC3339) {
		t.Fatalf("validFrom %v", *h[0].ValidFrom)
	}
	if h[1].Version != 359 || *h[1].ValidFrom != t2.Format(time.RFC3339) || *h[1].ValidUntil != t3.Format(time.RFC3339) || h[1].Current {
		t.Fatalf("previous: %+v", h[1])
	}
	if *h[2].ValidUntil != t2.Format(time.RFC3339) || h[2].UserName != "appuser_db" || h[2].AccountID != "116_3" {
		t.Fatalf("oldest: %+v", h[2])
	}
}

func TestMergeTimeline(t *testing.T) {
	at := func(s int64) time.Time { return time.Unix(s, 0).UTC() }
	members := []pairMember{
		{ID: "116_3", UserName: "appuser_db", Status: "Active", Versions: []version{{ID: 359, At: at(100)}, {ID: 373, At: at(400)}}},
		{ID: "116_27", UserName: "appuser_db_02", Status: "Inactive", Versions: []version{{ID: 3, At: at(50)}, {ID: 5, At: at(300)}, {ID: 6, At: at(500)}}},
	}
	tl := mergeTimeline(members, 8)
	order := []string{}
	for _, e := range tl {
		order = append(order, fmt.Sprintf("%s#%d", e.UserName, e.Version))
	}
	if strings.Join(order, " ") != "appuser_db_02#6 appuser_db#373 appuser_db_02#5 appuser_db#359 appuser_db_02#3" {
		t.Fatalf("order %v", order)
	}
	inUse := 0
	for _, e := range tl {
		if e.InUse {
			inUse++
			if e.Version != 373 || e.DualStatus != "Active" {
				t.Fatalf("in use must be the current version of the Active member: %+v", e)
			}
		}
	}
	if inUse != 1 {
		t.Fatalf("exactly one version in use, got %d", inUse)
	}
	// validUntil comes from the SAME account, not from the other member
	if tl[3].Version != 359 || *tl[3].ValidUntil != at(400).Format(time.RFC3339) {
		t.Fatalf("359 until %v", *tl[3].ValidUntil)
	}
	if tl[0].ValidUntil != nil || !tl[0].Current || tl[0].InUse {
		t.Fatalf("current Inactive version stays open but not in use: %+v", tl[0])
	}
	if len(mergeTimeline(members, 4)) != 4 {
		t.Fatal("limit")
	}
}

func TestDetailsCarryPairAndTimeline(t *testing.T) {
	f, h := setup(t)
	f.activity = `{"Activities":[{"Date":1760269000,"Action":"Update Account Properties","MoreInfo":"DualAccountStatus"},{"Date":1760269500,"Action":"Retrieve password"}]}`
	code, m := get(t, h, "/api/vault/accounts/116_27")
	if code != 200 {
		t.Fatalf("got %d %v", code, m)
	}
	pair := m["pair"].(map[string]any)
	if pair["conjurPath"] != "data/vault/dev-demo-aslan/dbuser_dual" {
		t.Fatalf("conjurPath %v", pair["conjurPath"])
	}
	active := pair["active"].(map[string]any)
	if active["userName"] != "appuser_db" || active["since"] != "2025-10-12T11:36:40Z" || active["sinceSource"] != "activities" {
		t.Fatalf("active %v", active)
	}
	tl := m["pairTimeline"].([]any)
	if len(tl) != 4 || tl[0].(map[string]any)["userName"] != "appuser_db" || tl[0].(map[string]any)["inUse"] != true {
		t.Fatalf("timeline %v", tl)
	}
	acc := m["account"].(map[string]any)
	if acc["dualStatus"] != "Inactive" || acc["conjurPath"] != "data/vault/dev-demo-aslan/dbuser_dual" {
		t.Fatalf("account %v", acc)
	}
	// without activities, since is omitted rather than guessed
	f.activity = ""
	cacheMu.Lock()
	cache = map[string]cached{}
	cacheMu.Unlock()
	_, m = get(t, h, "/api/vault/accounts/116_3")
	if _, ok := m["pair"].(map[string]any)["active"].(map[string]any)["since"]; ok {
		t.Fatal("since must be omitted when unknown")
	}
}

func TestParseActivitiesShapes(t *testing.T) {
	for _, b := range []string{
		`[{"date":"1760269000","action":"Update account","moreInfo":"Property DualAccountStatus changed"}]`,
		`{"value":[{"Date":1760269000,"Action":"x","Reason":"DualAccountStatus=Active"}]}`,
	} {
		if got, ok := parseActivitiesSince([]byte(b)); !ok || got.Unix() != 1760269000 {
			t.Fatalf("%s: %v %v", b, got, ok)
		}
	}
	if _, ok := parseActivitiesSince([]byte(`null`)); ok {
		t.Fatal("null")
	}
}
