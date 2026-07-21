// pcloud-proxy — a thin, stateless proxy in front of the CyberArk Privilege
// Cloud REST API for the /pcloud admin tool on demo.minha.cloud.
//
// Design notes
//   - The browser never talks to CyberArk directly (CORS + secret handling).
//   - The proxy stores NOTHING: the user's platform token is passed on every
//     request via the X-Pcloud-Token header and forwarded as a Bearer token.
//   - The tenant's real URLs are resolved at runtime from the public tenant
//     discovery service given only PCLOUD_SUBDOMAIN — no hostnames are baked in.
//   - Every handler returns a `_trace` array describing the upstream calls it
//     made (method, url, status, ms) so the UI can show the flow step by step.
//   - Only the safes in ALLOWED_SAFES may be read or written through this proxy.
//   - Passwords, secrets and tokens are never logged.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	subdomain     = os.Getenv("PCLOUD_SUBDOMAIN")
	allowedOrigin = getEnv("ALLOWED_ORIGIN", "https://demo.minha.cloud")
	allowedSafes  = parseSafes(getEnv("ALLOWED_SAFES", "dev-demo-aslan,devsecops"))

	httpClient = &http.Client{Timeout: 30 * time.Second}

	logonMu   sync.Mutex
	logonHits = map[string][]time.Time{}

	tenantMu  sync.Mutex
	tenantVal *tenant
	tenantAt  time.Time
	tenantTTL = time.Hour
)

const logonWindow, logonMax = 15 * time.Minute, 12

type tenant struct {
	PcloudAPI   string
	IdentityAPI string
}

type traceEntry struct {
	Step   string `json:"step"`
	Method string `json:"method"`
	URL    string `json:"url"`
	Status int    `json:"status"`
	MS     int64  `json:"ms"`
}

func main() {
	if subdomain == "" {
		log.Fatal("PCLOUD_SUBDOMAIN env var is required")
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/pcloud/healthz", func(w http.ResponseWriter, r *http.Request) { io.WriteString(w, "ok") })
	mux.HandleFunc("/api/pcloud/config", hConfig)
	mux.HandleFunc("/api/pcloud/logon", hLogon)
	mux.HandleFunc("/api/pcloud/platforms", hPlatforms)
	mux.HandleFunc("/api/pcloud/accounts", hAccounts)     // GET list (?safe=), POST create
	mux.HandleFunc("/api/pcloud/accounts/", hAccountByID) // /{id}, /{id}/rotate, /{id}/reveal

	addr := getEnv("ADDR", ":8080")
	log.Printf("pcloud-proxy listening on %s — subdomain=%s safes=%v", addr, subdomain, safeList())
	log.Fatal(http.ListenAndServe(addr, withSecurity(mux)))
}

// ─── middleware ────────────────────────────────────────────────────────────────

func withSecurity(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Pcloud-Token")
		}
		// Secrets must never be cached by any intermediary or the browser.
		w.Header().Set("Cache-Control", "no-store")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		// State-changing requests must originate from our own page.
		if r.Method == http.MethodPost {
			if o := r.Header.Get("Origin"); o != "" && o != allowedOrigin {
				writeJSON(w, http.StatusForbidden, map[string]any{"error": "origin not allowed"})
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// ─── handlers ──────────────────────────────────────────────────────────────────

func hConfig(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"subdomain": subdomain,
		"safes":     safeList(),
	})
}

func hLogon(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}
	ip := ipOf(r)
	if !logonAllowed(ip) {
		writeJSON(w, http.StatusTooManyRequests, map[string]any{"error": "too many logon attempts — wait a few minutes"})
		return
	}
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<16)).Decode(&body); err != nil ||
		body.Username == "" || body.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "username and password are required"})
		return
	}

	tr := []traceEntry{}
	t, err := getTenant(&tr)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": "tenant discovery failed: " + err.Error(), "_trace": tr})
		return
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	form.Set("client_id", body.Username)
	form.Set("client_secret", body.Password)
	u := t.IdentityAPI + "/oauth2/platformtoken"
	status, respBody := doCall(&tr, "authenticate — platform token (client_credentials)",
		http.MethodPost, u, map[string]string{"Content-Type": "application/x-www-form-urlencoded"},
		[]byte(form.Encode()))

	if status != http.StatusOK {
		writeJSON(w, http.StatusUnauthorized, map[string]any{
			"error":  "authentication failed — check the user, permissions or password",
			"_trace": tr,
		})
		return
	}
	var tokResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int    `json:"expires_in"`
	}
	_ = json.Unmarshal(respBody, &tokResp)
	writeJSON(w, http.StatusOK, map[string]any{
		"token":     tokResp.AccessToken,
		"tokenType": tokResp.TokenType,
		"expiresIn": tokResp.ExpiresIn,
		"_trace":    tr,
	})
}

func hPlatforms(w http.ResponseWriter, r *http.Request) {
	bearer, ok := bearerOf(w, r)
	if !ok {
		return
	}
	tr := []traceEntry{}
	t, err := getTenant(&tr)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": err.Error(), "_trace": tr})
		return
	}
	status, body := doCall(&tr, "list active platforms", http.MethodGet,
		t.PcloudAPI+"/PasswordVault/api/Platforms?active=true", bearerHdr(bearer), nil)
	if status != http.StatusOK {
		writeJSON(w, status, map[string]any{"error": errMsg(body), "_trace": tr})
		return
	}
	var pr struct {
		Platforms []struct {
			General struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"general"`
		} `json:"Platforms"`
	}
	_ = json.Unmarshal(body, &pr)
	out := make([]map[string]string, 0, len(pr.Platforms))
	for _, p := range pr.Platforms {
		if p.General.ID != "" {
			out = append(out, map[string]string{"id": p.General.ID, "name": p.General.Name})
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"platforms": out, "_trace": tr})
}

func hAccounts(w http.ResponseWriter, r *http.Request) {
	bearer, ok := bearerOf(w, r)
	if !ok {
		return
	}
	tr := []traceEntry{}
	t, err := getTenant(&tr)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": err.Error(), "_trace": tr})
		return
	}

	switch r.Method {
	case http.MethodGet:
		safe := r.URL.Query().Get("safe")
		if !safeAllowed(safe) {
			writeJSON(w, http.StatusForbidden, map[string]any{"error": "safe not allowed by this tool"})
			return
		}
		q := url.Values{}
		q.Set("filter", "safeName eq "+safe)
		q.Set("limit", "1000")
		status, body := doCall(&tr, "list accounts in "+safe, http.MethodGet,
			t.PcloudAPI+"/PasswordVault/api/Accounts?"+q.Encode(), bearerHdr(bearer), nil)
		writePassthrough(w, status, body, tr)

	case http.MethodPost:
		var in struct {
			SafeName            string `json:"safeName"`
			PlatformID          string `json:"platformId"`
			Name                string `json:"name"`
			Address             string `json:"address"`
			UserName            string `json:"userName"`
			Secret              string `json:"secret"`
			SecretType          string `json:"secretType"`
			AutomaticManagement bool   `json:"automaticManagement"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 1<<16)).Decode(&in); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid body"})
			return
		}
		if !safeAllowed(in.SafeName) {
			writeJSON(w, http.StatusForbidden, map[string]any{"error": "safe not allowed by this tool"})
			return
		}
		if in.PlatformID == "" || in.UserName == "" || in.Address == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "platformId, userName and address are required"})
			return
		}
		if in.SecretType == "" {
			in.SecretType = "password"
		}
		payload := map[string]any{
			"safeName":   in.SafeName,
			"platformId": in.PlatformID,
			"userName":   in.UserName,
			"address":    in.Address,
			"secretType": in.SecretType,
			"secretManagement": map[string]any{
				"automaticManagementEnabled": in.AutomaticManagement,
			},
		}
		if in.Name != "" {
			payload["name"] = in.Name
		}
		if in.Secret != "" {
			payload["secret"] = in.Secret
		}
		b, _ := json.Marshal(payload)
		status, body := doCall(&tr, "create account in "+in.SafeName, http.MethodPost,
			t.PcloudAPI+"/PasswordVault/api/Accounts", bearerHdr(bearer), b)
		writePassthrough(w, status, body, tr)

	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

// hAccountByID handles /api/pcloud/accounts/{id}, /{id}/rotate, /{id}/reveal
func hAccountByID(w http.ResponseWriter, r *http.Request) {
	bearer, ok := bearerOf(w, r)
	if !ok {
		return
	}
	rest := strings.TrimPrefix(r.URL.Path, "/api/pcloud/accounts/")
	parts := strings.Split(rest, "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "account id required"})
		return
	}

	tr := []traceEntry{}
	t, err := getTenant(&tr)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": err.Error(), "_trace": tr})
		return
	}

	// Always fetch the account first: this both returns its details and lets us
	// enforce that it lives in one of the allowed safes before any action.
	status, detBody := doCall(&tr, "get account details", http.MethodGet,
		t.PcloudAPI+"/PasswordVault/api/Accounts/"+url.PathEscape(id), bearerHdr(bearer), nil)
	if status != http.StatusOK {
		writeJSON(w, status, map[string]any{"error": errMsg(detBody), "_trace": tr})
		return
	}
	var det struct {
		SafeName string `json:"safeName"`
	}
	_ = json.Unmarshal(detBody, &det)
	if !safeAllowed(det.SafeName) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "account is not in a safe managed by this tool", "_trace": tr})
		return
	}

	switch {
	case action == "" && r.Method == http.MethodGet:
		writePassthrough(w, status, detBody, tr)

	case action == "rotate" && r.Method == http.MethodPost:
		b, _ := json.Marshal(map[string]any{"ChangeEntireGroup": false})
		st, body := doCall(&tr, "trigger CPM change (rotate now)", http.MethodPost,
			t.PcloudAPI+"/PasswordVault/api/Accounts/"+url.PathEscape(id)+"/Change", bearerHdr(bearer), b)
		if st >= 400 {
			writeJSON(w, st, map[string]any{"error": errMsg(body), "_trace": tr})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"status": "rotation requested — the CPM will change the secret shortly", "_trace": tr})

	case action == "reveal" && r.Method == http.MethodPost:
		var in struct {
			Reason string `json:"reason"`
		}
		_ = json.NewDecoder(io.LimitReader(r.Body, 1<<14)).Decode(&in)
		if in.Reason == "" {
			in.Reason = "Retrieved via /pcloud admin tool"
		}
		b, _ := json.Marshal(map[string]any{"reason": in.Reason})
		st, body := doCall(&tr, "retrieve secret value", http.MethodPost,
			t.PcloudAPI+"/PasswordVault/api/Accounts/"+url.PathEscape(id)+"/Password/Retrieve", bearerHdr(bearer), b)
		if st != http.StatusOK {
			writeJSON(w, st, map[string]any{"error": errMsg(body), "_trace": tr})
			return
		}
		// Retrieve returns the secret as a quoted JSON string; never trace it.
		var secret string
		if json.Unmarshal(body, &secret) != nil {
			secret = string(body)
		}
		writeJSON(w, http.StatusOK, map[string]any{"secret": secret, "_trace": tr})

	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "unsupported action"})
	}
}

// ─── upstream helpers ──────────────────────────────────────────────────────────

// doCall performs an upstream HTTP call and appends a trace entry. It never
// records request/response bodies (which may contain secrets) — only metadata.
func doCall(tr *[]traceEntry, step, method, u string, headers map[string]string, body []byte) (int, []byte) {
	start := time.Now()
	var rdr io.Reader
	if body != nil {
		rdr = bytes.NewReader(body)
	}
	req, err := http.NewRequest(method, u, rdr)
	if err != nil {
		*tr = append(*tr, traceEntry{Step: step, Method: method, URL: redact(u), Status: 0, MS: 0})
		return 0, nil
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := httpClient.Do(req)
	ms := time.Since(start).Milliseconds()
	if err != nil {
		*tr = append(*tr, traceEntry{Step: step, Method: method, URL: redact(u), Status: 0, MS: ms})
		return 0, nil
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	*tr = append(*tr, traceEntry{Step: step, Method: method, URL: redact(u), Status: resp.StatusCode, MS: ms})
	return resp.StatusCode, b
}

func getTenant(tr *[]traceEntry) (*tenant, error) {
	tenantMu.Lock()
	if tenantVal != nil && time.Since(tenantAt) < tenantTTL {
		t := tenantVal
		tenantMu.Unlock()
		*tr = append(*tr, traceEntry{Step: "resolve tenant URLs (cached)", Method: "GET", URL: "platform-discovery.cyberark.cloud", Status: 200, MS: 0})
		return t, nil
	}
	tenantMu.Unlock()

	u := "https://platform-discovery.cyberark.cloud/api/public/tenant-discovery?bySubdomain=" + url.QueryEscape(subdomain)
	status, body := doCall(tr, "resolve tenant URLs (discovery)", http.MethodGet, u, nil, nil)
	if status != http.StatusOK {
		return nil, fmt.Errorf("discovery returned %d", status)
	}
	var d struct {
		Services []struct {
			ServiceName string `json:"service_name"`
			Endpoints   []struct {
				API string `json:"api"`
			} `json:"endpoints"`
		} `json:"services"`
	}
	if err := json.Unmarshal(body, &d); err != nil {
		return nil, err
	}
	t := &tenant{}
	for _, s := range d.Services {
		if len(s.Endpoints) == 0 || s.Endpoints[0].API == "" {
			continue
		}
		api := strings.TrimRight(s.Endpoints[0].API, "/")
		switch s.ServiceName {
		case "pcloud":
			t.PcloudAPI = api
		case "identity_administration", "identity_user_portal":
			if t.IdentityAPI == "" {
				t.IdentityAPI = api
			}
		}
	}
	if t.PcloudAPI == "" {
		return nil, fmt.Errorf("pcloud endpoint not found for subdomain")
	}
	if t.IdentityAPI == "" {
		t.IdentityAPI = fmt.Sprintf("https://%s.my.idaptive.app", subdomain)
	}
	tenantMu.Lock()
	tenantVal, tenantAt = t, time.Now()
	tenantMu.Unlock()
	return t, nil
}

// ─── small utilities ───────────────────────────────────────────────────────────

func bearerOf(w http.ResponseWriter, r *http.Request) (string, bool) {
	tok := r.Header.Get("X-Pcloud-Token")
	if tok == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "not authenticated — log on first"})
		return "", false
	}
	return tok, true
}

func bearerHdr(tok string) map[string]string {
	return map[string]string{"Authorization": "Bearer " + tok, "Content-Type": "application/json"}
}

// writePassthrough forwards an upstream JSON object, injecting the call trace.
func writePassthrough(w http.ResponseWriter, status int, body []byte, tr []traceEntry) {
	if status >= 400 {
		writeJSON(w, status, map[string]any{"error": errMsg(body), "_trace": tr})
		return
	}
	var m map[string]any
	if err := json.Unmarshal(body, &m); err != nil {
		writeJSON(w, status, map[string]any{"raw": string(body), "_trace": tr})
		return
	}
	m["_trace"] = tr
	writeJSON(w, status, m)
}

func errMsg(body []byte) string {
	var e struct {
		ErrorCode    string `json:"ErrorCode"`
		ErrorMessage string `json:"ErrorMessage"`
	}
	if json.Unmarshal(body, &e) == nil && e.ErrorMessage != "" {
		return e.ErrorMessage
	}
	s := strings.TrimSpace(string(body))
	if len(s) > 300 {
		s = s[:300]
	}
	if s == "" {
		s = "upstream error"
	}
	return s
}

// redact strips query strings from traced URLs (a safe-name filter is harmless,
// but tokens must never appear — belt and suspenders).
func redact(u string) string {
	if i := strings.IndexByte(u, '?'); i >= 0 {
		return u[:i]
	}
	return u
}

func logonAllowed(ip string) bool {
	now := time.Now()
	logonMu.Lock()
	defer logonMu.Unlock()
	keep := logonHits[ip][:0]
	for _, t := range logonHits[ip] {
		if now.Sub(t) < logonWindow {
			keep = append(keep, t)
		}
	}
	if len(keep) >= logonMax {
		logonHits[ip] = keep
		return false
	}
	logonHits[ip] = append(keep, now)
	return true
}

func ipOf(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	if xr := r.Header.Get("X-Real-IP"); xr != "" {
		return strings.TrimSpace(xr)
	}
	h, _, _ := net.SplitHostPort(r.RemoteAddr)
	return h
}

func parseSafes(csv string) map[string]bool {
	m := map[string]bool{}
	for _, s := range strings.Split(csv, ",") {
		if s = strings.TrimSpace(s); s != "" {
			m[strings.ToLower(s)] = true
		}
	}
	return m
}

func safeAllowed(name string) bool { return name != "" && allowedSafes[strings.ToLower(name)] }

func safeList() []string {
	out := make([]string, 0, len(allowedSafes))
	for s := range allowedSafes {
		out = append(out, s)
	}
	return out
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
