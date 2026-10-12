package main

import (
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func resetPresence() {
	presMu.Lock()
	presSeen, presIP = map[string]time.Time{}, map[string]*ipWindow{}
	presMu.Unlock()
}

func uid(n int) string { return fmt.Sprintf("%08x-0000-4000-8000-%012x", n, n) }

func TestPresenceExpiresAfterSixtySeconds(t *testing.T) {
	resetPresence()
	t0 := time.Now()
	heartbeat(uid(1), "198.51.100.1", t0)
	heartbeat(uid(2), "198.51.100.1", t0.Add(30*time.Second))
	if n := countAt(t0.Add(59 * time.Second)); n != 2 {
		t.Fatalf("both online at 59 s, got %d", n)
	}
	if n := countAt(t0.Add(61 * time.Second)); n != 1 {
		t.Fatalf("first expired at 61 s, got %d", n)
	}
	if n := countAt(t0.Add(91 * time.Second)); n != 0 {
		t.Fatalf("all expired, got %d", n)
	}
}

func countAt(at time.Time) int {
	presMu.Lock()
	defer presMu.Unlock()
	n := 0
	for _, t := range presSeen {
		if at.Sub(t) < presenceTTL {
			n++
		}
	}
	return n
}

func TestPresenceCapsEntries(t *testing.T) {
	resetPresence()
	old := presenceMax
	presenceMax = 10
	defer func() { presenceMax = old }()
	t0 := time.Now()
	for i := 0; i < 25; i++ {
		// distinct IPs so the per-IP budget does not interfere
		heartbeat(uid(i), fmt.Sprintf("203.0.113.%d", i), t0.Add(time.Duration(i)*time.Millisecond))
	}
	presMu.Lock()
	n := len(presSeen)
	_, newest := presSeen[uid(24)]
	_, oldest := presSeen[uid(0)]
	presMu.Unlock()
	if n != 10 || !newest || oldest {
		t.Fatalf("cap keeps the newest 10: n=%d newest=%v oldest=%v", n, newest, oldest)
	}
}

func TestPresenceLimitsPerIP(t *testing.T) {
	resetPresence()
	t0 := time.Now()
	ok := 0
	for i := 0; i < presenceIPNewMax+10; i++ {
		if heartbeat(uid(i), "192.0.2.7", t0) {
			ok++
		}
	}
	if ok != presenceIPNewMax {
		t.Fatalf("new ids per IP capped at %d, got %d", presenceIPNewMax, ok)
	}
	// the same id beating too often is accepted but not recounted
	resetPresence()
	heartbeat(uid(1), "192.0.2.8", t0)
	heartbeat(uid(1), "192.0.2.8", t0.Add(2*time.Second))
	presMu.Lock()
	seen := presSeen[uid(1)]
	presMu.Unlock()
	if !seen.Equal(t0) {
		t.Fatal("a beat within 10 s must not move last seen")
	}
}

func TestPresenceValidatesIDAndOrigin(t *testing.T) {
	_, h := setup(t)
	resetPresence()
	for _, body := range []string{`{"id":"x"}`, `{"id":"` + strings.Repeat("a", 300) + `"}`, `not json`, `{"id":"123e4567-e89b-12d3-a456-42661417400Z"}`} {
		req := httptest.NewRequest("POST", "/api/vault/presence", strings.NewReader(body))
		req.Header.Set("Origin", "https://demo.minha.cloud")
		req.Header.Set("X-Cofre-Info", "1")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != 400 {
			t.Fatalf("%s: got %d", body, rec.Code)
		}
	}
	req := httptest.NewRequest("POST", "/api/vault/presence", strings.NewReader(`{"id":"`+uid(7)+`"}`))
	req.Header.Set("Origin", "https://evil.example")
	req.Header.Set("X-Cofre-Info", "1")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 403 {
		t.Fatalf("origin: got %d", rec.Code)
	}
	req = httptest.NewRequest("POST", "/api/vault/presence", strings.NewReader(`{"id":"`+uid(7)+`"}`))
	req.Header.Set("Origin", "https://demo.minha.cloud")
	req.Header.Set("X-Cofre-Info", "1")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"online":1`) || !strings.Contains(rec.Body.String(), `"rotation":null`) {
		t.Fatalf("got %d %s", rec.Code, rec.Body.String())
	}
}

func TestPresenceAnnouncesRotation(t *testing.T) {
	f, h := setup(t)
	f.onChange = "never"
	_, m := post(t, h, "/api/vault/accounts/116_3/rotate")
	_, p := get(t, h, "/api/vault/presence")
	rot, _ := p["rotation"].(map[string]any)
	if rot == nil || rot["rotationId"] != m["rotationId"] || rot["from"] != "appuser_db" || rot["to"] != "appuser_db_02" {
		t.Fatalf("presence rotation %v", p["rotation"])
	}
	waitEnd(t, h, m["rotationId"].(string))
	_, p = get(t, h, "/api/vault/presence")
	if rot, _ := p["rotation"].(map[string]any); rot == nil || rot["step"] != stepFailed {
		t.Fatalf("a rotation that just ended stays announced: %v", p["rotation"])
	}
}
