package main

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ipLimiter applies per-address abuse caps without accounts: a ceiling on
// concurrent connections and a token bucket on brand-new room creations.
// Joining or syncing an existing room is never budgeted — those are the viral
// path and cost the relay almost nothing.
type ipLimiter struct {
	mu             sync.Mutex
	maxConns       int // 0 = unlimited
	createsPerHour int // 0 = unlimited
	byIP           map[string]*ipEntry
}

type ipEntry struct {
	conns      int
	tokens     float64
	lastRefill time.Time
}

func newIPLimiter(maxConns, createsPerHour int) *ipLimiter {
	return &ipLimiter{
		maxConns:       maxConns,
		createsPerHour: createsPerHour,
		byIP:           make(map[string]*ipEntry),
	}
}

func (l *ipLimiter) entry(ip string) *ipEntry {
	e, ok := l.byIP[ip]
	if !ok {
		e = &ipEntry{tokens: float64(l.createsPerHour), lastRefill: time.Now()}
		l.byIP[ip] = e
	}
	return e
}

func (l *ipLimiter) acquireConn(ip string) bool {
	if l.maxConns <= 0 || ip == "" {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	e := l.entry(ip)
	if e.conns >= l.maxConns {
		return false
	}
	e.conns++
	return true
}

func (l *ipLimiter) releaseConn(ip string) {
	if l.maxConns <= 0 || ip == "" {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	if e, ok := l.byIP[ip]; ok && e.conns > 0 {
		e.conns--
	}
}

// allowRoomCreate spends one token from ip's bucket; capacity and refill rate
// both equal createsPerHour, so bursts up to a full hour's budget are fine.
func (l *ipLimiter) allowRoomCreate(ip string) bool {
	if l.createsPerHour <= 0 || ip == "" {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	e := l.entry(ip)
	now := time.Now()
	e.tokens = min(float64(l.createsPerHour), e.tokens+now.Sub(e.lastRefill).Hours()*float64(l.createsPerHour))
	e.lastRefill = now
	if e.tokens < 1 {
		return false
	}
	e.tokens--
	return true
}

// prune drops idle entries so the limiter itself cannot leak memory.
func (l *ipLimiter) prune() {
	l.mu.Lock()
	defer l.mu.Unlock()
	for ip, e := range l.byIP {
		if e.conns == 0 && e.tokens >= float64(l.createsPerHour) {
			delete(l.byIP, ip)
		}
	}
}

// clientIP best-effort identifies the caller for rate limiting. Proxy headers
// are trusted because production deploys sit behind cloudflared/nginx, where
// RemoteAddr is always the tunnel. Exposing the relay directly weakens the
// per-IP caps (headers can be forged) — deploy behind a proxy.
func clientIP(r *http.Request) string {
	if v := r.Header.Get("CF-Connecting-IP"); v != "" {
		return v
	}
	if v := r.Header.Get("X-Forwarded-For"); v != "" {
		if i := strings.IndexByte(v, ','); i >= 0 {
			v = v[:i]
		}
		return strings.TrimSpace(v)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
