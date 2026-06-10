package main

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ipBucket is a per-address token bucket (capacity and refill rate = n per
// hour). Same shape as relay/limits.go — kept separate because the modules
// are independent binaries.
type ipBucket struct {
	mu      sync.Mutex
	perHour int // 0 = unlimited
	byIP    map[string]*bucketEntry
}

type bucketEntry struct {
	tokens     float64
	lastRefill time.Time
}

func newIPBucket(perHour int) *ipBucket {
	return &ipBucket{perHour: perHour, byIP: make(map[string]*bucketEntry)}
}

func (l *ipBucket) allow(ip string) bool {
	if l.perHour <= 0 || ip == "" {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	e, ok := l.byIP[ip]
	if !ok {
		e = &bucketEntry{tokens: float64(l.perHour), lastRefill: now}
		l.byIP[ip] = e
	}
	e.tokens = min(float64(l.perHour), e.tokens+now.Sub(e.lastRefill).Hours()*float64(l.perHour))
	e.lastRefill = now
	if e.tokens < 1 {
		return false
	}
	e.tokens--
	// Opportunistic cleanup keeps the map from growing unbounded.
	if len(l.byIP) > 10_000 {
		for k, v := range l.byIP {
			if v.tokens >= float64(l.perHour) {
				delete(l.byIP, k)
			}
		}
	}
	return true
}

// clientIP mirrors relay/limits.go: trust proxy headers because production
// sits behind cloudflared/nginx; direct exposure weakens per-IP caps.
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
