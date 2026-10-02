// site-likes: the "Like" counter of demo.minha.cloud.
//
//	GET  /api/likes          -> {"likes": N}
//	POST /api/likes          -> {"likes": N, "accepted": true|false}
//	GET  /api/likes/healthz  -> ok
//
// The total lives in memory and is persisted to ConfigMap <NAMESPACE>/<CONFIGMAP>
// (key "count") through the in-cluster Kubernetes API, so it survives restarts
// without a volume. Abuse limits: browser Origin must be ALLOWED_ORIGIN, one
// like per client IP per IP_WINDOW, and at most DAILY_CAP accepted likes per
// UTC day. Run a single replica.
package main

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

const saDir = "/var/run/secrets/kubernetes.io/serviceaccount"

var (
	namespace     = getEnv("NAMESPACE", "conjur")
	configMap     = getEnv("CONFIGMAP", "site-likes")
	allowedOrigin = getEnv("ALLOWED_ORIGIN", "https://demo.minha.cloud")
	ipWindow      = getDuration("IP_WINDOW", 12*time.Hour)
	dailyCap      = getInt("DAILY_CAP", 500)
)

type store struct {
	mu       sync.Mutex
	count    int
	dirty    bool
	seen     map[string]time.Time // client IP -> last accepted like
	day      string
	dayCount int
}

func main() {
	k, err := newKube()
	if err != nil {
		log.Fatalf("kubernetes client: %v", err)
	}
	s := &store{seen: map[string]time.Time{}}
	if n, err := k.readCount(); err != nil {
		log.Fatalf("read configmap %s/%s: %v", namespace, configMap, err)
	} else {
		s.count = n
	}
	log.Printf("site-likes starting with %d likes (configmap %s/%s)", s.count, namespace, configMap)

	go s.flushLoop(k)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/likes/healthz", func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("ok")) })
	mux.HandleFunc("GET /api/likes", func(w http.ResponseWriter, _ *http.Request) {
		s.mu.Lock()
		n := s.count
		s.mu.Unlock()
		writeJSON(w, http.StatusOK, map[string]any{"likes": n})
	})
	mux.HandleFunc("POST /api/likes", func(w http.ResponseWriter, r *http.Request) {
		if o := r.Header.Get("Origin"); o != allowedOrigin {
			writeJSON(w, http.StatusForbidden, map[string]any{"error": "origin not allowed"})
			return
		}
		n, ok := s.like(clientIP(r), time.Now())
		writeJSON(w, http.StatusOK, map[string]any{"likes": n, "accepted": ok})
	})

	srv := &http.Server{Addr: ":8080", Handler: noStore(mux), ReadHeaderTimeout: 5 * time.Second}
	log.Fatal(srv.ListenAndServe())
}

func (s *store) like(ip string, now time.Time) (int, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	day := now.UTC().Format("2006-01-02")
	if day != s.day {
		s.day, s.dayCount = day, 0
		for k, t := range s.seen { // forget old entries once a day
			if now.Sub(t) > ipWindow {
				delete(s.seen, k)
			}
		}
	}
	if t, ok := s.seen[ip]; ok && now.Sub(t) < ipWindow {
		return s.count, false
	}
	if s.dayCount >= dailyCap {
		return s.count, false
	}
	s.seen[ip] = now
	s.dayCount++
	s.count++
	s.dirty = true
	return s.count, true
}

func (s *store) flushLoop(k *kube) {
	for range time.Tick(5 * time.Second) {
		s.mu.Lock()
		n, dirty := s.count, s.dirty
		s.dirty = false
		s.mu.Unlock()
		if !dirty {
			continue
		}
		if err := k.writeCount(n); err != nil {
			log.Printf("persist %d: %v (will retry)", n, err)
			s.mu.Lock()
			s.dirty = true
			s.mu.Unlock()
		}
	}
}

// ── minimal in-cluster Kubernetes client (ConfigMap get + merge patch) ──

type kube struct {
	base   string
	token  string
	client *http.Client
}

func newKube() (*kube, error) {
	host, port := os.Getenv("KUBERNETES_SERVICE_HOST"), os.Getenv("KUBERNETES_SERVICE_PORT")
	if host == "" {
		return nil, fmt.Errorf("not running in a cluster")
	}
	tok, err := os.ReadFile(saDir + "/token")
	if err != nil {
		return nil, err
	}
	ca, err := os.ReadFile(saDir + "/ca.crt")
	if err != nil {
		return nil, err
	}
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(ca)
	return &kube{
		base:   "https://" + net.JoinHostPort(host, port),
		token:  strings.TrimSpace(string(tok)),
		client: &http.Client{Timeout: 10 * time.Second, Transport: &http.Transport{TLSClientConfig: &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}}},
	}, nil
}

func (k *kube) url() string {
	return fmt.Sprintf("%s/api/v1/namespaces/%s/configmaps/%s", k.base, namespace, configMap)
}

func (k *kube) do(method, contentType string, body []byte) (*http.Response, error) {
	req, err := http.NewRequest(method, k.url(), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+k.token)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	return k.client.Do(req)
}

func (k *kube) readCount() (int, error) {
	resp, err := k.do(http.MethodGet, "", nil)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("GET configmap: HTTP %d", resp.StatusCode)
	}
	var cm struct {
		Data map[string]string `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&cm); err != nil {
		return 0, err
	}
	n, _ := strconv.Atoi(strings.TrimSpace(cm.Data["count"]))
	return n, nil
}

func (k *kube) writeCount(n int) error {
	body, _ := json.Marshal(map[string]any{"data": map[string]string{"count": strconv.Itoa(n)}})
	resp, err := k.do(http.MethodPatch, "application/merge-patch+json", body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("PATCH configmap: HTTP %d", resp.StatusCode)
	}
	return nil
}

// ── helpers ──

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	if xr := r.Header.Get("X-Real-Ip"); xr != "" {
		return xr
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	return host
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func noStore(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getInt(k string, def int) int {
	if n, err := strconv.Atoi(os.Getenv(k)); err == nil && n > 0 {
		return n
	}
	return def
}

func getDuration(k string, def time.Duration) time.Duration {
	if d, err := time.ParseDuration(os.Getenv(k)); err == nil && d > 0 {
		return d
	}
	return def
}
