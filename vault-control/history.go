package main

// Version history with validity windows. Only metadata is read: the Vault
// returns the version id, who changed it and when, never the value.

import (
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
)

// version is one secret version of one account, as the Vault reports it.
type version struct {
	ID         int       `json:"id"`
	ModifiedBy string    `json:"modifiedBy"`
	At         time.Time `json:"at"` // zero when the Vault gave no usable date
	Temporary  bool      `json:"temporary"`
}

// histEntry is one row of the page: a version and the window in which it was
// the value of the account. validUntil is the date of the next version of the
// SAME account, null for the current one.
type histEntry struct {
	Version    int     `json:"version"`
	AccountID  string  `json:"accountId"`
	UserName   string  `json:"userName"`
	ModifiedBy string  `json:"modifiedBy"`
	ValidFrom  *string `json:"validFrom"`
	ValidUntil *string `json:"validUntil"`
	Temporary  bool    `json:"temporary"`
	Current    bool    `json:"current"`
	DualStatus string  `json:"dualStatus,omitempty"`
	InUse      bool    `json:"inUse"`

	from time.Time // for sorting the merged pair timeline
}

// parseEpoch normalizes the dates of the API: epoch seconds as a number or a
// string (milliseconds when the value is that large), or an ISO 8601 string.
func parseEpoch(v any) (time.Time, bool) {
	var f float64
	switch x := v.(type) {
	case nil:
		return time.Time{}, false
	case float64:
		f = x
	case int:
		f = float64(x)
	case int64:
		f = float64(x)
	case json.Number:
		n, err := x.Float64()
		if err != nil {
			return time.Time{}, false
		}
		f = n
	case string:
		s := strings.TrimSpace(x)
		if s == "" {
			return time.Time{}, false
		}
		if n, err := strconv.ParseFloat(s, 64); err == nil {
			f = n
		} else if t, err := time.Parse(time.RFC3339, s); err == nil {
			return t.UTC(), true
		} else {
			return time.Time{}, false
		}
	default:
		return time.Time{}, false
	}
	if f <= 0 {
		return time.Time{}, false
	}
	if f > 1e12 {
		return time.UnixMilli(int64(f)).UTC(), true
	}
	return time.Unix(int64(f), 0).UTC(), true
}

func isoPtr(t time.Time) *string {
	if t.IsZero() {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}

// versions returns the versions of an account, oldest first (30 s cache).
func versions(id string) ([]version, error) {
	key := "hist:" + id
	if b, ok := fromCache(key, 30*time.Second); ok {
		var vs []version
		if json.Unmarshal(b, &vs) == nil {
			return vs, nil
		}
	}
	b, code, err := pcloud("GET", "/Accounts/"+id+"/Secret/Versions/", nil)
	if err != nil || code != 200 {
		return nil, fmt.Errorf("versions: HTTP %d %v", code, err)
	}
	vs, err := parseVersions(b)
	if err != nil {
		return nil, err
	}
	j, _ := json.Marshal(vs)
	toCache(key, j)
	return vs, nil
}

func parseVersions(b []byte) ([]version, error) {
	var v struct {
		Versions []struct {
			VersionID        int    `json:"versionID"`
			ModifiedBy       string `json:"modifiedBy"`
			ModificationDate any    `json:"modificationDate"`
			IsTemporary      bool   `json:"isTemporary"`
		} `json:"versions"`
	}
	if err := json.Unmarshal(b, &v); err != nil {
		return nil, fmt.Errorf("versions: %w", err)
	}
	out := make([]version, 0, len(v.Versions))
	for _, x := range v.Versions {
		at, _ := parseEpoch(x.ModificationDate)
		out = append(out, version{ID: x.VersionID, ModifiedBy: x.ModifiedBy, At: at, Temporary: x.IsTemporary})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

// buildHistory turns the versions of one account (any order) into rows,
// newest first, each with its validity window.
func buildHistory(accountID, userName string, vs []version) []histEntry {
	asc := append([]version(nil), vs...)
	sort.Slice(asc, func(i, j int) bool { return asc[i].ID < asc[j].ID })
	out := make([]histEntry, 0, len(asc))
	for i := len(asc) - 1; i >= 0; i-- {
		v := asc[i]
		e := histEntry{
			Version: v.ID, AccountID: accountID, UserName: userName, ModifiedBy: v.ModifiedBy,
			ValidFrom: isoPtr(v.At), Temporary: v.Temporary, Current: i == len(asc)-1, from: v.At,
		}
		if i+1 < len(asc) {
			e.ValidUntil = isoPtr(asc[i+1].At)
		}
		out = append(out, e)
	}
	return out
}

// pairMember is one account of a Dual Account pair with its versions.
type pairMember struct {
	ID, Name, UserName, Status string
	Versions                   []version
}

// mergeTimeline merges the versions of both members of a pair, newest first.
// inUse marks the one version the Secrets Manager (and the External Secrets
// Operator) delivers: the current version of the Active member.
func mergeTimeline(members []pairMember, max int) []histEntry {
	var all []histEntry
	for _, m := range members {
		active := strings.EqualFold(m.Status, "Active")
		for _, e := range buildHistory(m.ID, m.UserName, m.Versions) {
			e.DualStatus = m.Status
			e.InUse = active && e.Current
			all = append(all, e)
		}
	}
	sort.SliceStable(all, func(i, j int) bool {
		a, b := all[i], all[j]
		if !a.from.Equal(b.from) {
			if a.from.IsZero() || b.from.IsZero() {
				return b.from.IsZero() // unknown dates last
			}
			return a.from.After(b.from)
		}
		return a.Version > b.Version
	})
	return limit(all, max)
}

func limit[T any](s []T, n int) []T {
	if n > 0 && len(s) > n {
		return s[:n]
	}
	return s
}

// ---------------------------------------------------------------------------
// Activities: when did the Active member become Active
// ---------------------------------------------------------------------------

// activitySince looks for the latest change of DualAccountStatus in the
// account activities. Best effort: when the endpoint is missing or the entries
// do not mention the property, it reports nothing rather than guessing.
func activitySince(id string) (time.Time, bool) {
	key := "act:" + id
	b, ok := fromCache(key, 60*time.Second)
	if !ok {
		body, code, err := pcloud("GET", "/Accounts/"+id+"/Activities/", nil)
		if err != nil || code != 200 {
			body = []byte("null")
		}
		toCache(key, body)
		b = body
	}
	return parseActivitiesSince(b)
}

func parseActivitiesSince(b []byte) (time.Time, bool) {
	var items []map[string]any
	var wrap map[string]any
	if json.Unmarshal(b, &items) != nil || items == nil {
		if json.Unmarshal(b, &wrap) != nil {
			return time.Time{}, false
		}
		for _, k := range []string{"Activities", "activities", "value", "GetAccountActivitiesSlashResult"} {
			if arr, ok := wrap[k].([]any); ok {
				for _, x := range arr {
					if m, ok := x.(map[string]any); ok {
						items = append(items, m)
					}
				}
				break
			}
		}
	}
	var best time.Time
	for _, it := range items {
		text := ""
		var date any
		for k, v := range it {
			switch strings.ToLower(k) {
			case "action", "moreinfo", "reason":
				text += " " + strings.ToLower(fmt.Sprint(v))
			case "date", "time", "timestamp":
				date = v
			}
		}
		if !strings.Contains(text, "dualaccountstatus") {
			continue
		}
		if t, ok := parseEpoch(date); ok && t.After(best) {
			best = t
		}
	}
	return best, !best.IsZero()
}
