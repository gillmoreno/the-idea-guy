package main

import (
	"bytes"
	"testing"
)

func TestFrameType(t *testing.T) {
	update := []byte{msgUpdate, 1, 2, 3}
	if got := frameType(update); got != msgUpdate {
		t.Fatalf("update frame: got %x want %x", got, msgUpdate)
	}
	checkpoint := []byte{msgCheckpoint, 9, 9}
	if got := frameType(checkpoint); got != msgCheckpoint {
		t.Fatalf("checkpoint frame: got %x want %x", got, msgCheckpoint)
	}
	legacy := []byte{0xab, 0xcd}
	if got := frameType(legacy); got != msgUpdate {
		t.Fatalf("legacy: got %x want append-as-update", got)
	}
}

func TestCompactReplacesLog(t *testing.T) {
	h := newHub("")
	rm := h.getRoom("test-room")
	frame := []byte{msgCheckpoint, 0xde, 0xad}

	h.compactAndBroadcast("test-room", rm, nil, frame)

	rm.mu.Lock()
	defer rm.mu.Unlock()
	if len(rm.log) != 1 {
		t.Fatalf("log len = %d, want 1", len(rm.log))
	}
	if !bytes.Equal(rm.log[0], frame) {
		t.Fatalf("log entry mismatch")
	}
}

func TestAppendGrowsLog(t *testing.T) {
	h := newHub("")
	rm := h.getRoom("grow-room")
	h.appendAndBroadcast("grow-room", rm, nil, []byte{msgUpdate, 1})
	h.appendAndBroadcast("grow-room", rm, nil, []byte{msgUpdate, 2})

	rm.mu.Lock()
	defer rm.mu.Unlock()
	if len(rm.log) != 2 {
		t.Fatalf("log len = %d, want 2", len(rm.log))
	}
}
