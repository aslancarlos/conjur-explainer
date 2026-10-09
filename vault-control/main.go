// vault-control backs the "Cofre Info" page on demo.minha.cloud.
//
// Chain of trust, no static secret anywhere:
//
//	pod service account JWT (aud conjur) -> Conjur authn-jwt/<service-id>
//	  -> data/vault/<safe>/<account>/{username,password} (synced from the Vault)
//	    -> Identity oauth2/platformtoken (client_credentials)
//	      -> Privilege Cloud REST API, limited to one Safe
//
// No secret value of the Safe is ever retrieved: the history shows version
// metadata only. The one credential read is the API account, from Conjur.
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

// Tenant, Safe and credential come from the environment (a ConfigMap kept out
// of Git); only generic defaults live here.
var (
	conjurURL     = mustEnv("CONJUR_APPLIANCE_URL")
	conjurAccount = getEnv("CONJUR_ACCOUNT", "conjur")
	authnURL      = mustEnv("CONJUR_AUTHN_URL")
	jwtFile       = getEnv("CONJUR_JWT_TOKEN_FILE", "/var/run/secrets/tokens/jwt")
	credPath      = mustEnv("CRED_PATH") // data/vault/<safe>/<account>
	identityURL   = mustEnv("IDENTITY_URL")
	pcloudURL     = mustEnv("PCLOUD_URL")
	safe          = mustEnv("SAFE")
	selfAccount   = credPath[strings.LastIndex(credPath, "/")+1:]
	allowedOrigin = mustEnv("ALLOWED_ORIGIN")
	devOrigins    = os.Getenv("DEV_ORIGINS") // e.g. "http://localhost:5173" for local QA only

	httpClient = &http.Client{Timeout: 20 * time.Second}

	// platform token, refreshed before it expires or on a 401
	tokMu  sync.Mutex
	tok    string
	tokExp time.Time

	// short caches so a busy demo does not hammer the Vault
	cacheMu sync.Mutex
	cache   = map[string]cached{}

	// rotation rate limit: one request per IP per minute, 40 per day overall
	rotMu    sync.Mutex
	rotPerIP = map[string]time.Time{}
	rotDay   time.Time
	rotCount int
)

type cached struct {
	at   time.Time
	body []byte
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/vault/healthz", func(w http.ResponseWriter, _ *http.Request) { w.Write([]byte("ok")) })
	mux.HandleFunc("/api/vault/chain", chain)
	mux.HandleFunc("/api/vault/accounts", accounts)
	mux.HandleFunc("/api/vault/accounts/", account)
	addr := getEnv("ADDR", ":8080")
	log.Printf("vault-control listening on %s safe=%s cred=%s", addr, safe, credPath)
	log.Fatal(http.ListenAndServe(addr, mux))
}

// ---------------------------------------------------------------------------
// Conjur (JWT only) and Identity
// ---------------------------------------------------------------------------

func conjurToken() (string, error) {
	jwt, err := os.ReadFile(jwtFile)
	if err != nil {
		return "", fmt.Errorf("service account JWT: %w", err)
	}
	form := url.Values{"jwt": {strings.TrimSpace(string(jwt))}}
	req, _ := http.NewRequest("POST", authnURL+"/"+conjurAccount+"/authenticate", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept-Encoding", "base64")
	b, code, err := do(req)
	if err != nil || code != 200 {
		return "", fmt.Errorf("conjur authn-jwt: HTTP %d %v", code, err)
	}
	return string(b), nil
}

func conjurVar(ctok, id string) (string, error) {
	req, _ := http.NewRequest("GET", conjurURL+"/secrets/"+conjurAccount+"/variable/"+url.PathEscape(id), nil)
	req.Header.Set("Authorization", `Token token="`+ctok+`"`)
	b, code, err := do(req)
	if err != nil || code != 200 {
		return "", fmt.Errorf("conjur variable %s: HTTP %d %v", id, code, err)
	}
	return string(b), nil
}

// platformToken returns a cached Identity token, fetching the credential from
// Conjur on every refresh so a rotated password is picked up after the sync.
func platformToken(force bool) (string, error) {
	tokMu.Lock()
	defer tokMu.Unlock()
	if !force && tok != "" && time.Now().Before(tokExp) {
		return tok, nil
	}
	ctok, err := conjurToken()
	if err != nil {
		return "", err
	}
	user, err := conjurVar(ctok, credPath+"/username")
	if err != nil {
		return "", err
	}
	pass, err := conjurVar(ctok, credPath+"/password")
	if err != nil {
		return "", err
	}
	form := url.Values{"grant_type": {"client_credentials"}, "client_id": {user}, "client_secret": {pass}}
	req, _ := http.NewRequest("POST", identityURL+"/oauth2/platformtoken", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	b, code, err := do(req)
	if err != nil || code != 200 {
		return "", fmt.Errorf("identity platformtoken: HTTP %d %v", code, err)
	}
	var t struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if json.Unmarshal(b, &t) != nil || t.AccessToken == "" {
		return "", errors.New("identity platformtoken: no access_token")
	}
	if t.ExpiresIn <= 0 {
		t.ExpiresIn = 900
	}
	tok, tokExp = t.AccessToken, time.Now().Add(time.Duration(t.ExpiresIn-60)*time.Second)
	return tok, nil
}

// pcloud calls the Privilege Cloud API, retrying once with a fresh token on 401.
func pcloud(method, path string, body any) ([]byte, int, error) {
	for attempt := 0; attempt < 2; attempt++ {
		t, err := platformToken(attempt > 0)
		if err != nil {
			return nil, 0, err
		}
		var rd io.Reader
		if body != nil {
			j, _ := json.Marshal(body)
			rd = bytes.NewReader(j)
		}
		req, _ := http.NewRequest(method, pcloudURL+path, rd)
		req.Header.Set("Authorization", "Bearer "+t)
		req.Header.Set("Content-Type", "application/json")
		b, code, err := do(req)
		if code == 401 && attempt == 0 {
			continue
		}
		return b, code, err
	}
	return nil, 401, errors.New("unauthorized")
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// chain reports each hop of the trust chain without revealing anything secret.
func chain(w http.ResponseWriter, r *http.Request) {
	steps := []map[string]any{}
	add := func(name string, err error) bool {
		s := map[string]any{"step": name, "ok": err == nil}
		if err != nil {
			s["error"] = err.Error()
		}
		steps = append(steps, s)
		return err == nil
	}
	ctok, err := conjurToken()
	if add("conjur_jwt", err) {
		_, err = conjurVar(ctok, credPath+"/username")
		if add("conjur_secret", err) {
			_, err = platformToken(true)
			if add("identity_token", err) {
				_, code, err := pcloud("GET", "/Safes/"+safe+"/", nil)
				if err == nil && code != 200 {
					err = fmt.Errorf("HTTP %d", code)
				}
				add("privilege_cloud", err)
			}
		}
	}
	writeJSON(w, 200, map[string]any{"safe": safe, "credential": selfAccount, "steps": steps})
}

func accounts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if b, ok := fromCache("accounts", 15*time.Second); ok && r.URL.Query().Get("fresh") == "" {
		writeRaw(w, b)
		return
	}
	b, code, err := pcloud("GET", "/Accounts?limit=1000&filter="+url.QueryEscape("safeName eq "+safe), nil)
	if err != nil || code != 200 {
		writeErr(w, code, err, b)
		return
	}
	var list struct {
		Value []map[string]any `json:"value"`
	}
	json.Unmarshal(b, &list)
	out := make([]map[string]any, 0, len(list.Value))
	for _, a := range list.Value {
		out = append(out, summarize(a))
	}
	resp, _ := json.Marshal(map[string]any{"safe": safe, "credential": selfAccount, "accounts": out, "fetchedAt": time.Now().UTC()})
	toCache("accounts", resp)
	writeRaw(w, resp)
}

// account serves /api/vault/accounts/{id} (GET: details + masked history)
// and /api/vault/accounts/{id}/rotate (POST: CPM change now).
func account(w http.ResponseWriter, r *http.Request) {
	rest := strings.TrimPrefix(r.URL.Path, "/api/vault/accounts/")
	id, action, _ := strings.Cut(rest, "/")
	if id == "" || strings.ContainsAny(id, "?&%/.") {
		http.Error(w, "bad account id", http.StatusBadRequest)
		return
	}
	switch {
	case action == "" && r.Method == http.MethodGet:
		details(w, id)
	case action == "rotate" && r.Method == http.MethodPost:
		rotate(w, r, id)
	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

func details(w http.ResponseWriter, id string) {
	b, code, err := pcloud("GET", "/Accounts/"+id+"/", nil)
	if err != nil || code != 200 {
		writeErr(w, code, err, b)
		return
	}
	var a map[string]any
	json.Unmarshal(b, &a)
	if a["safeName"] != safe {
		http.Error(w, "account outside the Safe", http.StatusForbidden)
		return
	}
	hist, herr := history(id)
	resp := map[string]any{"account": summarize(a), "history": hist}
	if herr != nil {
		resp["historyError"] = herr.Error()
	}
	writeJSON(w, 200, resp)
}

// history returns the current version and the two before it (metadata only).
func history(id string) ([]map[string]any, error) {
	key := "hist:" + id
	if b, ok := fromCache(key, 30*time.Second); ok {
		var h []map[string]any
		json.Unmarshal(b, &h)
		return h, nil
	}
	b, code, err := pcloud("GET", "/Accounts/"+id+"/Secret/Versions/", nil)
	if err != nil || code != 200 {
		return nil, fmt.Errorf("versions: HTTP %d %v", code, err)
	}
	var v struct {
		Versions []struct {
			VersionID        int    `json:"versionID"`
			ModifiedBy       string `json:"modifiedBy"`
			ModificationDate any    `json:"modificationDate"`
			IsTemporary      bool   `json:"isTemporary"`
		} `json:"versions"`
	}
	json.Unmarshal(b, &v)
	vs := v.Versions
	sort.Slice(vs, func(i, j int) bool { return vs[i].VersionID > vs[j].VersionID }) // newest first
	out := []map[string]any{}
	for i, ver := range vs {
		if i == 3 {
			break
		}
		// metadata only: the value is never retrieved, the page shows a fixed mask
		out = append(out, map[string]any{"label": []string{"atual", "atual-1", "atual-2"}[i], "version": ver.VersionID,
			"modifiedBy": ver.ModifiedBy, "modifiedAt": ver.ModificationDate, "temporary": ver.IsTemporary})
	}
	j, _ := json.Marshal(out)
	toCache(key, j)
	return out, nil
}

func rotate(w http.ResponseWriter, r *http.Request, id string) {
	// CSRF: exact Origin match plus a custom header (forces a CORS preflight,
	// which this service never answers, so cross-site pages cannot send it).
	if !originAllowed(r.Header.Get("Origin")) || r.Header.Get("X-Cofre-Info") != "1" {
		http.Error(w, "origin not allowed", http.StatusForbidden)
		return
	}
	ip := clientIP(r)
	if msg := rotateAllowed(ip); msg != "" {
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": msg})
		return
	}
	b, code, err := pcloud("GET", "/Accounts/"+id+"/", nil)
	if err != nil || code != 200 {
		writeErr(w, code, err, b)
		return
	}
	var a map[string]any
	json.Unmarshal(b, &a)
	if a["safeName"] != safe {
		http.Error(w, "account outside the Safe", http.StatusForbidden)
		return
	}
	if a["name"] == selfAccount {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "self"})
		return
	}
	b, code, err = pcloud("POST", "/Accounts/"+id+"/Change/", map[string]any{})
	if err != nil || (code != 200 && code != 204) {
		writeErr(w, code, err, b)
		return
	}
	log.Printf("rotate requested account=%s name=%v ip=%s", id, a["name"], ip)
	cacheMu.Lock()
	delete(cache, "accounts")
	delete(cache, "hist:"+id)
	cacheMu.Unlock()
	writeJSON(w, http.StatusAccepted, map[string]any{"requested": true, "account": id})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// summarize keeps the metadata the page explains and drops anything secret.
func summarize(a map[string]any) map[string]any {
	props, _ := a["platformAccountProperties"].(map[string]any)
	sm, _ := a["secretManagement"].(map[string]any)
	name, _ := a["name"].(string)
	// Dual Accounts carry the pair's virtual user name and the "current" flag (CurrInd).
	dual := false
	for _, k := range []string{"VirtualUserName", "CurrInd", "DualAccountStatus"} {
		if v, ok := props[k]; ok && v != "" {
			dual = true
		}
	}
	return map[string]any{
		"id": a["id"], "name": name, "userName": a["userName"], "address": a["address"],
		"platformId": a["platformId"], "secretType": a["secretType"], "createdTime": a["createdTime"],
		"properties": props,
		"management": sm,
		"dual":       dual,
		"self":       name == selfAccount,
		"conjurPath": "data/vault/" + safe + "/" + name,
	}
}

func rotateAllowed(ip string) string {
	rotMu.Lock()
	defer rotMu.Unlock()
	now := time.Now()
	if last, ok := rotPerIP[ip]; ok && now.Sub(last) < time.Minute {
		return "wait"
	}
	if day := now.UTC().Truncate(24 * time.Hour); !day.Equal(rotDay) {
		rotDay, rotCount = day, 0
	}
	if rotCount >= 40 {
		return "daily"
	}
	rotPerIP[ip], rotCount = now, rotCount+1
	return ""
}

// originAllowed requires an Origin header that matches exactly.
func originAllowed(o string) bool {
	if o == "" {
		return false
	}
	if o == allowedOrigin {
		return true
	}
	for _, d := range strings.Split(devOrigins, ",") {
		if d = strings.TrimSpace(d); d != "" && o == d {
			return true
		}
	}
	return false
}

func clientIP(r *http.Request) string {
	if f := r.Header.Get("X-Forwarded-For"); f != "" {
		return strings.TrimSpace(strings.Split(f, ",")[0])
	}
	h, _, _ := net.SplitHostPort(r.RemoteAddr)
	return h
}

func fromCache(k string, ttl time.Duration) ([]byte, bool) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	c, ok := cache[k]
	return c.body, ok && time.Since(c.at) < ttl
}

func toCache(k string, b []byte) {
	cacheMu.Lock()
	cache[k] = cached{time.Now(), b}
	cacheMu.Unlock()
}

func do(req *http.Request) ([]byte, int, error) {
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	return b, resp.StatusCode, err
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func writeRaw(w http.ResponseWriter, b []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Write(b)
}

// writeErr reports upstream failures without echoing tokens or secrets.
func writeErr(w http.ResponseWriter, code int, err error, body []byte) {
	msg := ""
	if err != nil {
		msg = err.Error()
	}
	var e struct {
		ErrorCode    string `json:"ErrorCode"`
		ErrorMessage string `json:"ErrorMessage"`
	}
	if json.Unmarshal(body, &e) == nil && e.ErrorMessage != "" {
		msg = e.ErrorCode + ": " + e.ErrorMessage
	}
	if code == 0 {
		code = http.StatusBadGateway
	}
	writeJSON(w, http.StatusBadGateway, map[string]any{"error": msg, "upstream": code})
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("%s is required", k)
	}
	return v
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
