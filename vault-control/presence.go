package main

// Presence: how many browser tabs have the site open, and the pair rotation
// every visitor sees as a notice.
//
// Only a random per-tab id (a UUID the page keeps in sessionStorage) and the
// time it was last seen are stored: no IP, user agent or cookie is tied to it.
// The IP is used only by the rate limiter, in a counter that expires after a
// minute. One replica, so the state lives in memory.

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"regexp"
	"sort"
	"sync"
	"time"
)

var (
	presenceTTL      = 60 * time.Second // online = heartbeat in the last minute
	presenceMax      = 5000             // tabs remembered at most (oldest dropped)
	presenceMinEvery = 10 * time.Second // one counted heartbeat per id per 10 s
	presenceIPNewMax = 30               // new ids per IP per minute
	presenceIPMax    = 120              // heartbeats per IP per minute
	// The demo NLB does not preserve the client IP, so every visitor arrives from a private
	// address of the VPC. For those, the window is shared by everybody: use a site-wide ceiling.
	presenceSharedNewMax = 600
	presenceSharedMax    = 3000

	presMu   sync.Mutex
	presSeen = map[string]time.Time{}
	presIP   = map[string]*ipWindow{}

	uuidRe = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
)

type ipWindow struct {
	start  time.Time
	beats  int
	newIDs int
}

// presence serves POST (heartbeat) and GET (read only) on /api/vault/presence.
func presence(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, 200, presenceView(time.Now()))
	case http.MethodPost:
		if !originAllowed(r.Header.Get("Origin")) || r.Header.Get("X-Cofre-Info") != "1" {
			http.Error(w, "origin not allowed", http.StatusForbidden)
			return
		}
		var body struct {
			ID string `json:"id"`
		}
		b, _ := io.ReadAll(io.LimitReader(r.Body, 256))
		if json.Unmarshal(b, &body) != nil || !uuidRe.MatchString(body.ID) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad_id"})
			return
		}
		now := time.Now()
		if !heartbeat(body.ID, clientIP(r), now) {
			writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "rate"})
			return
		}
		writeJSON(w, 200, presenceView(now))
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// heartbeat records a tab as seen. It returns false when the IP exceeded its
// budget; a too-frequent beat of a known id is accepted but not recounted.
func heartbeat(id, ip string, now time.Time) bool {
	presMu.Lock()
	defer presMu.Unlock()
	win := presIP[ip]
	if win == nil || now.Sub(win.start) >= time.Minute {
		win = &ipWindow{start: now}
		presIP[ip] = win
	}
	maxBeats, maxNew := presenceIPMax, presenceIPNewMax
	if a := net.ParseIP(ip); a != nil && (a.IsPrivate() || a.IsLoopback()) {
		maxBeats, maxNew = presenceSharedMax, presenceSharedNewMax
	}
	win.beats++
	if win.beats > maxBeats {
		return false
	}
	last, known := presSeen[id]
	if known && now.Sub(last) < presenceMinEvery {
		return true
	}
	if !known || now.Sub(last) >= presenceTTL {
		win.newIDs++
		if win.newIDs > maxNew {
			return false
		}
	}
	presSeen[id] = now
	prunePresence(now)
	return true
}

// prunePresence drops expired ids, stale IP windows and, above the cap, the
// oldest ids. Called with presMu held.
func prunePresence(now time.Time) {
	for id, t := range presSeen {
		if now.Sub(t) >= presenceTTL {
			delete(presSeen, id)
		}
	}
	for ip, w := range presIP {
		if now.Sub(w.start) >= time.Minute {
			delete(presIP, ip)
		}
	}
	if over := len(presSeen) - presenceMax; over > 0 {
		type kv struct {
			id string
			t  time.Time
		}
		all := make([]kv, 0, len(presSeen))
		for id, t := range presSeen {
			all = append(all, kv{id, t})
		}
		sort.Slice(all, func(i, j int) bool { return all[i].t.Before(all[j].t) })
		for _, x := range all[:over] {
			delete(presSeen, x.id)
		}
	}
}

func onlineCount(now time.Time) int {
	presMu.Lock()
	defer presMu.Unlock()
	n := 0
	for _, t := range presSeen {
		if now.Sub(t) < presenceTTL {
			n++
		}
	}
	return n
}

// presenceView is the answer of both methods: online tabs and the rotation to
// announce (running, or ended in the last 2 minutes).
func presenceView(now time.Time) map[string]any {
	var rot *rotation
	rotStoreMu.Lock()
	for i := len(rotOrder) - 1; i >= 0; i-- {
		r := rotations[rotOrder[i]]
		if !finished(r) || (r.FinishedAt != nil && now.Sub(*r.FinishedAt) < 2*time.Minute) {
			rot = snapshotLocked(r)
		}
		break
	}
	rotStoreMu.Unlock()
	resp := map[string]any{"online": onlineCount(now), "now": now.UTC().Format(time.RFC3339), "rotation": nil}
	if rot != nil {
		resp["rotation"] = rot
	}
	return resp
}
