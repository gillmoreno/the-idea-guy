// Command relay is the thin, dumb sync pipe for the Local-First Kit.
//
// It knows nothing about ChoreBoard or any app. Clients connect to a "room"
// (one room per family) and exchange opaque, end-to-end-encrypted CRDT updates.
// The relay only broadcasts those blobs to other peers in the same room and
// keeps an append-only log so a device that was offline can catch up. It can
// never read the contents — privacy and data ownership stay with the family.
package main

import (
	"context"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/coder/websocket"
)

const (
	maxMessageBytes = 32 << 20 // 32 MiB ceiling per encrypted update
	writeTimeout    = 30 * time.Second
)

func main() {
	addr := envOr("RELAY_ADDR", ":4500")
	dataDir := os.Getenv("RELAY_DATA_DIR") // empty = memory only

	hub := newHub(dataDir)
	if dataDir != "" {
		if err := hub.load(); err != nil {
			log.Printf("relay: could not load persisted rooms: %v", err)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/sync", hub.handleSync)

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("relay: listening on %s (persistence: %s)", addr, dataDirLabel(dataDir))
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("relay: %v", err)
	}
}

// hub owns every room and the (optional) on-disk append log.
type hub struct {
	mu      sync.Mutex
	rooms   map[string]*room
	dataDir string
}

type room struct {
	mu    sync.Mutex
	peers map[*peer]struct{}
	log   [][]byte // opaque encrypted blobs, replayed to new peers
}

type peer struct {
	conn *websocket.Conn
	send chan []byte
}

func newHub(dataDir string) *hub {
	return &hub{rooms: make(map[string]*room), dataDir: dataDir}
}

func (h *hub) getRoom(name string) *room {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[name]
	if !ok {
		r = &room{peers: make(map[*peer]struct{})}
		h.rooms[name] = r
	}
	return r
}

func (h *hub) handleSync(w http.ResponseWriter, r *http.Request) {
	roomName := r.URL.Query().Get("room")
	if roomName == "" {
		http.Error(w, "missing room", http.StatusBadRequest)
		return
	}

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		// The relay is meant to be embedded behind whatever origin hosts the
		// app; families may also self-host. Skip strict origin checks here and
		// rely on the per-family encryption key for actual access control.
		InsecureSkipVerify: true,
	})
	if err != nil {
		return
	}
	conn.SetReadLimit(maxMessageBytes)
	ctx := r.Context()

	rm := h.getRoom(roomName)
	p := &peer{conn: conn, send: make(chan []byte, 64)}

	// Snapshot the catch-up log, then register so we don't miss live updates.
	rm.mu.Lock()
	backlog := make([][]byte, len(rm.log))
	copy(backlog, rm.log)
	rm.peers[p] = struct{}{}
	rm.mu.Unlock()

	defer func() {
		rm.mu.Lock()
		delete(rm.peers, p)
		rm.mu.Unlock()
		conn.Close(websocket.StatusNormalClosure, "")
	}()

	go p.writePump(ctx)

	// Replay history so an offline device catches up on reconnect.
	for _, blob := range backlog {
		select {
		case p.send <- blob:
		case <-ctx.Done():
			return
		}
	}

	for {
		typ, data, err := conn.Read(ctx)
		if err != nil {
			return
		}
		if typ != websocket.MessageBinary || len(data) == 0 {
			continue
		}
		h.appendAndBroadcast(roomName, rm, p, data)
	}
}

func (h *hub) appendAndBroadcast(roomName string, rm *room, from *peer, blob []byte) {
	rm.mu.Lock()
	rm.log = append(rm.log, blob)
	targets := make([]*peer, 0, len(rm.peers))
	for p := range rm.peers {
		if p != from {
			targets = append(targets, p)
		}
	}
	rm.mu.Unlock()

	if h.dataDir != "" {
		if err := h.persist(roomName, blob); err != nil {
			log.Printf("relay: persist failed for room: %v", err)
		}
	}

	for _, p := range targets {
		select {
		case p.send <- blob:
		default:
			// Slow consumer: drop and let it resync from the log on reconnect.
		}
	}
}

func (p *peer) writePump(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case blob := <-p.send:
			wctx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := p.conn.Write(wctx, websocket.MessageBinary, blob)
			cancel()
			if err != nil {
				return
			}
		}
	}
}

// --- optional disk persistence (opaque base64 lines per room) ---

func (h *hub) roomFile(roomName string) string {
	// Hash-free but filesystem-safe: room names are already opaque ids.
	safe := base64.URLEncoding.EncodeToString([]byte(roomName))
	return filepath.Join(h.dataDir, safe+".log")
}

func (h *hub) persist(roomName string, blob []byte) error {
	if err := os.MkdirAll(h.dataDir, 0o755); err != nil {
		return err
	}
	f, err := os.OpenFile(h.roomFile(roomName), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.WriteString(base64.StdEncoding.EncodeToString(blob) + "\n")
	return err
}

func (h *hub) load() error {
	entries, err := os.ReadDir(h.dataDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".log" {
			continue
		}
		nameBytes, err := base64.URLEncoding.DecodeString(e.Name()[:len(e.Name())-len(".log")])
		if err != nil {
			continue
		}
		data, err := os.ReadFile(filepath.Join(h.dataDir, e.Name()))
		if err != nil {
			continue
		}
		rm := h.getRoom(string(nameBytes))
		for _, line := range splitLines(data) {
			if len(line) == 0 {
				continue
			}
			blob, err := base64.StdEncoding.DecodeString(string(line))
			if err != nil {
				continue
			}
			rm.log = append(rm.log, blob)
		}
	}
	return nil
}

func splitLines(data []byte) [][]byte {
	var out [][]byte
	start := 0
	for i, b := range data {
		if b == '\n' {
			out = append(out, data[start:i])
			start = i + 1
		}
	}
	if start < len(data) {
		out = append(out, data[start:])
	}
	return out
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func dataDirLabel(d string) string {
	if d == "" {
		return "memory only"
	}
	return d
}
