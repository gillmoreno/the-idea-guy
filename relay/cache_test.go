package main

import (
	"errors"
	"testing"
	"time"
)

func TestLazyLoadFromDisk(t *testing.T) {
	dir := t.TempDir()

	h1 := newHub(config{dataDir: dir})
	rm, err := h1.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom: %v", err)
	}
	if err := h1.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 1}); err != nil {
		t.Fatalf("append: %v", err)
	}
	if err := h1.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 2}); err != nil {
		t.Fatalf("append: %v", err)
	}

	// Simulate a restart: nothing resident until the first connect.
	h2 := newHub(config{dataDir: dir})
	if n := len(h2.rooms); n != 0 {
		t.Fatalf("rooms resident at startup = %d, want 0 (lazy-load)", n)
	}
	rm2, err := h2.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom after restart: %v", err)
	}
	rm2.mu.Lock()
	defer rm2.mu.Unlock()
	if len(rm2.log) != 2 {
		t.Fatalf("loaded log len = %d, want 2", len(rm2.log))
	}
	if rm2.logBytes != 4 {
		t.Fatalf("loaded logBytes = %d, want 4", rm2.logBytes)
	}
}

func TestEvictionAndSelfHeal(t *testing.T) {
	dir := t.TempDir()
	h := newHub(config{dataDir: dir, evictAfter: time.Millisecond})

	rm, err := h.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom: %v", err)
	}
	if err := h.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 7}); err != nil {
		t.Fatalf("append: %v", err)
	}

	if n := h.evictIdle(time.Now().Add(time.Second)); n != 1 {
		t.Fatalf("evicted = %d, want 1", n)
	}
	if !rm.evicted {
		t.Fatal("room not marked evicted")
	}
	if n := len(h.rooms); n != 0 {
		t.Fatalf("rooms resident after eviction = %d, want 0", n)
	}

	// Reconnect: a fresh instance is lazy-loaded from disk.
	rm2, err := h.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom after eviction: %v", err)
	}
	if rm2 == rm {
		t.Fatal("expected a fresh room instance after eviction")
	}
	rm2.mu.Lock()
	defer rm2.mu.Unlock()
	if len(rm2.log) != 1 {
		t.Fatalf("reloaded log len = %d, want 1", len(rm2.log))
	}
}

func TestEvictionSkipsRoomsWithPeers(t *testing.T) {
	h := newHub(config{dataDir: t.TempDir(), evictAfter: time.Millisecond})
	p := &peer{send: make(chan []byte, 1)}
	if _, _, err := h.join("fam", "", p); err != nil {
		t.Fatalf("join: %v", err)
	}
	if n := h.evictIdle(time.Now().Add(time.Second)); n != 0 {
		t.Fatalf("evicted = %d, want 0 (room has a peer)", n)
	}
}

func TestJoinRetriesAfterEviction(t *testing.T) {
	h := newHub(config{dataDir: t.TempDir(), evictAfter: time.Millisecond})
	rm, err := h.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom: %v", err)
	}
	rm.mu.Lock()
	rm.evicted = true // as the sweeper would, after removing it from the map
	rm.mu.Unlock()
	h.mu.Lock()
	delete(h.rooms, "fam")
	h.mu.Unlock()

	p := &peer{send: make(chan []byte, 1)}
	rm2, _, err := h.join("fam", "", p)
	if err != nil {
		t.Fatalf("join: %v", err)
	}
	if rm2 == rm {
		t.Fatal("join returned the evicted instance")
	}
}

func TestRoomLogCap(t *testing.T) {
	h := newHub(config{maxRoomLogBytes: 4})
	rm, err := h.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom: %v", err)
	}
	if err := h.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 1, 2}); err != nil {
		t.Fatalf("append within cap: %v", err)
	}
	if err := h.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 3, 4}); !errors.Is(err, errRoomLogFull) {
		t.Fatalf("append past cap: got %v, want errRoomLogFull", err)
	}
	// A checkpoint compacts the log and frees the budget again.
	h.compactAndBroadcast("fam", rm, nil, []byte{msgCheckpoint, 9})
	if err := h.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 5}); err != nil {
		t.Fatalf("append after compaction: %v", err)
	}
}

func TestRoomCreationBudget(t *testing.T) {
	h := newHub(config{roomCreatesPerIPHour: 2})
	if _, err := h.acquireRoom("a", "1.2.3.4"); err != nil {
		t.Fatalf("create a: %v", err)
	}
	if _, err := h.acquireRoom("b", "1.2.3.4"); err != nil {
		t.Fatalf("create b: %v", err)
	}
	if _, err := h.acquireRoom("c", "1.2.3.4"); !errors.Is(err, errTooManyRooms) {
		t.Fatalf("create c: got %v, want errTooManyRooms", err)
	}
	// Joining an existing room is never budgeted.
	if _, err := h.acquireRoom("a", "1.2.3.4"); err != nil {
		t.Fatalf("rejoin a: %v", err)
	}
	// Other addresses have their own budget.
	if _, err := h.acquireRoom("d", "5.6.7.8"); err != nil {
		t.Fatalf("create d from other ip: %v", err)
	}
}

func TestConnLimiter(t *testing.T) {
	l := newIPLimiter(2, 0)
	if !l.acquireConn("ip") || !l.acquireConn("ip") {
		t.Fatal("first two connections should be allowed")
	}
	if l.acquireConn("ip") {
		t.Fatal("third concurrent connection should be rejected")
	}
	l.releaseConn("ip")
	if !l.acquireConn("ip") {
		t.Fatal("connection after release should be allowed")
	}
}

func TestExpireIdleFiles(t *testing.T) {
	dir := t.TempDir()
	h := newHub(config{dataDir: dir, expireAfter: time.Millisecond})
	rm, err := h.acquireRoom("fam", "")
	if err != nil {
		t.Fatalf("acquireRoom: %v", err)
	}
	if err := h.appendAndBroadcast("fam", rm, nil, []byte{msgUpdate, 1}); err != nil {
		t.Fatalf("append: %v", err)
	}

	// Resident rooms are never expired from disk.
	h.expireIdleFiles(time.Now().Add(time.Hour))
	if !h.roomOnDisk("fam") {
		t.Fatal("resident room's file was expired")
	}

	// Once evicted from RAM and idle past the window, the file goes.
	h.mu.Lock()
	delete(h.rooms, "fam")
	h.mu.Unlock()
	h.expireIdleFiles(time.Now().Add(time.Hour))
	if h.roomOnDisk("fam") {
		t.Fatal("idle room file was not expired")
	}
}
