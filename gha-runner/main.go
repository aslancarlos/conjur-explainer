package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	token         = os.Getenv("GH_TOKEN")
	owner         = getEnv("REPO_OWNER", "aslancarlos")
	repo          = getEnv("REPO_NAME", "workshop-action")
	workflow      = getEnv("WORKFLOW_FILE", "main.yml")
	ref           = getEnv("WORKFLOW_REF", "main")
	allowedOrigin = getEnv("ALLOWED_ORIGIN", "https://demo.minha.cloud")

	perIPMu    sync.Mutex
	perIP      = map[string]time.Time{}
	perIPLimit = 10 * time.Minute

	globalMu    sync.Mutex
	globalDay   time.Time
	globalCount int
	globalLimit = 20

	httpClient = &http.Client{Timeout: 15 * time.Second}
)

func main() {
	if token == "" {
		log.Fatal("GH_TOKEN env var is required")
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/gha/healthz", healthz)
	mux.HandleFunc("/api/gha/run", run)
	mux.HandleFunc("/api/gha/runs/", runStatus)

	addr := getEnv("ADDR", ":8080")
	log.Printf("gha-runner listening on %s — repo=%s/%s workflow=%s ref=%s", addr, owner, repo, workflow, ref)
	log.Fatal(http.ListenAndServe(addr, withCORS(mux)))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func healthz(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	io.WriteString(w, "ok")
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

// checkRate returns ok=true if the request may proceed, or a human message otherwise.
func checkRate(ip string) (bool, string) {
	now := time.Now()

	perIPMu.Lock()
	if next, has := perIP[ip]; has && now.Before(next) {
		wait := next.Sub(now).Round(time.Second)
		perIPMu.Unlock()
		return false, fmt.Sprintf("rate_limited:per_ip:%s", wait)
	}
	perIPMu.Unlock()

	globalMu.Lock()
	defer globalMu.Unlock()
	today := now.UTC().Truncate(24 * time.Hour)
	if !globalDay.Equal(today) {
		globalDay = today
		globalCount = 0
	}
	if globalCount >= globalLimit {
		return false, "rate_limited:global_cap"
	}

	// Reserve the slot only after both checks pass.
	perIPMu.Lock()
	perIP[ip] = now.Add(perIPLimit)
	perIPMu.Unlock()
	globalCount++

	return true, ""
}

func run(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if o := r.Header.Get("Origin"); o != "" && o != allowedOrigin {
		http.Error(w, "origin not allowed", http.StatusForbidden)
		return
	}

	ip := ipOf(r)
	if ok, msg := checkRate(ip); !ok {
		writeJSON(w, http.StatusTooManyRequests, map[string]any{"error": msg})
		return
	}

	dispatchedAt := time.Now().UTC()
	if err := dispatch(); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": err.Error()})
		return
	}

	runID, err := findRun(dispatchedAt)
	if err != nil {
		writeJSON(w, http.StatusAccepted, map[string]any{
			"run_id":  nil,
			"pending": true,
			"note":    err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"run_id":   runID,
		"html_url": fmt.Sprintf("https://github.com/%s/%s/actions/runs/%d", owner, repo, runID),
	})
}

func dispatch() error {
	body, _ := json.Marshal(map[string]string{"ref": ref})
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/actions/workflows/%s/dispatches", owner, repo, workflow)
	req, _ := http.NewRequestWithContext(context.Background(), http.MethodPost, url, bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("dispatch failed: %d %s", resp.StatusCode, string(b))
	}
	return nil
}

type ghRun struct {
	ID         int64     `json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	HeadBranch string    `json:"head_branch"`
	Status     string    `json:"status"`
	HTMLURL    string    `json:"html_url"`
}

// findRun polls GitHub for up to 10s looking for the workflow_dispatch run we just triggered.
func findRun(after time.Time) (int64, error) {
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		url := fmt.Sprintf(
			"https://api.github.com/repos/%s/%s/actions/runs?event=workflow_dispatch&per_page=10",
			owner, repo,
		)
		var resp struct {
			WorkflowRuns []ghRun `json:"workflow_runs"`
		}
		if err := ghGetJSON(url, &resp); err == nil {
			for _, r := range resp.WorkflowRuns {
				if r.HeadBranch == ref && r.CreatedAt.After(after.Add(-3*time.Second)) {
					return r.ID, nil
				}
			}
		}
		time.Sleep(800 * time.Millisecond)
	}
	return 0, errors.New("dispatched but new run not visible yet — try refreshing the page")
}

func runStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/gha/runs/")
	if id == "" || strings.Contains(id, "/") {
		http.Error(w, "run id required", http.StatusBadRequest)
		return
	}

	type runResp struct {
		ID         int64      `json:"id"`
		Name       string     `json:"name"`
		Status     string     `json:"status"`
		Conclusion *string    `json:"conclusion"`
		CreatedAt  time.Time  `json:"created_at"`
		UpdatedAt  time.Time  `json:"updated_at"`
		HTMLURL    string     `json:"html_url"`
		RunStart   *time.Time `json:"run_started_at"`
	}
	type jobStep struct {
		Name        string     `json:"name"`
		Status      string     `json:"status"`
		Conclusion  *string    `json:"conclusion"`
		Number      int        `json:"number"`
		StartedAt   *time.Time `json:"started_at"`
		CompletedAt *time.Time `json:"completed_at"`
	}
	type job struct {
		ID          int64      `json:"id"`
		Name        string     `json:"name"`
		Status      string     `json:"status"`
		Conclusion  *string    `json:"conclusion"`
		StartedAt   *time.Time `json:"started_at"`
		CompletedAt *time.Time `json:"completed_at"`
		HTMLURL     string     `json:"html_url"`
		Steps       []jobStep  `json:"steps"`
	}
	type jobsResp struct {
		Jobs []job `json:"jobs"`
	}

	var runR runResp
	var jobsR jobsResp
	var errRun, errJobs error
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		errRun = ghGetJSON(fmt.Sprintf("https://api.github.com/repos/%s/%s/actions/runs/%s", owner, repo, id), &runR)
	}()
	go func() {
		defer wg.Done()
		errJobs = ghGetJSON(fmt.Sprintf("https://api.github.com/repos/%s/%s/actions/runs/%s/jobs?per_page=100", owner, repo, id), &jobsR)
	}()
	wg.Wait()

	if errRun != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": errRun.Error()})
		return
	}
	if errJobs != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": errJobs.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"run":  runR,
		"jobs": jobsR.Jobs,
	})
}

func ghGetJSON(url string, into any) error {
	req, _ := http.NewRequestWithContext(context.Background(), http.MethodGet, url, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("github %d: %s", resp.StatusCode, string(b))
	}
	return json.NewDecoder(resp.Body).Decode(into)
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
