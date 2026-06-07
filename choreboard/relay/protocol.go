package main

// Wire framing for opaque encrypted CRDT payloads.
// The type byte is NOT encrypted — only the relay routing layer sees it.

const (
	msgUpdate     byte = 0x00 // append to room log
	msgCheckpoint byte = 0x01 // replace log with this single frame (compaction)
	msgSyncEnd    byte = 0xfe // relay → client: backlog replay complete
)

func isFramed(data []byte) bool {
	if len(data) < 2 {
		return false
	}
	switch data[0] {
	case msgUpdate, msgCheckpoint:
		return true
	default:
		return false
	}
}

func frameType(data []byte) byte {
	if len(data) == 0 {
		return msgUpdate
	}
	if data[0] == msgUpdate || data[0] == msgCheckpoint {
		return data[0]
	}
	return msgUpdate // legacy blobs are treated as append-only updates
}
