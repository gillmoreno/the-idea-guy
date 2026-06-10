// Command relay is the thin, dumb sync pipe for the Local-First Kit.
//
// It knows nothing about ChoreBoard or any app. Clients connect to a "room"
// (one room per family) and exchange opaque, end-to-end-encrypted CRDT updates.
// The relay only broadcasts those blobs to other peers in the same room and
// keeps a replay log so a device that was offline can catch up. Clients may
// send checkpoint frames to compact the log to a single merged snapshot.
// It can never read the contents — privacy and data ownership stay with the family.
//
// The relay is a cache, not a vault: members' devices hold the canonical copy.
// Rooms are lazy-loaded from disk on first connect and evicted from RAM when
// idle; a member reconnecting to an evicted (or even deleted) room re-seeds it
// with a checkpoint. That keeps RAM proportional to *active* rooms, not
// all-rooms-ever.
package main

import (
	"context"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/coder/websocket"
)

const (
	writeTimeout  = 30 * time.Second
	sweepInterval = time.Minute
)

var (
	errRoomLogFull  = errors.New("room log full")
	errTooManyRooms = errors.New("room creation limit reached")
)

type config struct {
	addr                 string
	dataDir              string        // empty = memory only
	maxMessageBytes      int64         // ceiling per encrypted frame
	maxRoomLogBytes      int64         // ceiling per room backlog (0 = unlimited)
	evictAfter           time.Duration // idle RAM eviction; 0 = never (requires dataDir)
	expireAfter          time.Duration // idle disk deletion; 0 = never
	maxConnsPerIP        int           // concurrent sockets per address (0 = unlimited)
	roomCreatesPerIPHour int           // brand-new rooms per address per hour (0 = unlimited)
}

func loadConfig() config {
	cfg := config{
		addr:                 envOr("RELAY_ADDR", ":4500"),
		dataDir:              os.Getenv("RELAY_DATA_DIR"),
		maxMessageBytes:      envInt64("RELAY_MAX_MSG_BYTES", 8<<20),
		maxRoomLogBytes:      envInt64("RELAY_MAX_ROOM_LOG_BYTES", 64<<20),
		evictAfter:           envDuration("RELAY_EVICT_AFTER", 30*time.Minute),
		expireAfter:          envDuration("RELAY_EXPIRE_AFTER", 0),
		maxConnsPerIP:        envInt("RELAY_MAX_CONNS_PER_IP", 128),
		roomCreatesPerIPHour: envInt("RELAY_ROOM_CREATES_PER_IP_HOUR", 120),
	}
	if cfg.dataDir == "" && cfg.evictAfter > 0 {
		// Without persistence eviction would drop rooms, not cache them out.
		if os.Getenv("RELAY_EVICT_AFTER") != "" {
			log.Printf("relay: ignoring RELAY_EVICT_AFTER — eviction requires RELAY_DATA_DIR")
		}
		cfg.evictAfter = 0
	}
	return cfg
}

func main() {
	cfg := loadConfig()
	hub := newHub(cfg)

	if cfg.evictAfter > 0 || (cfg.expireAfter > 0 && cfg.dataDir != "") {
		go hub.sweeper()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/sync", hub.handleSync)

	srv := &http.Server{
		Addr:              cfg.addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("relay: listening on %s (persistence: %s, lazy-load on connect, evict idle after %s)",
		cfg.addr, dataDirLabel(cfg.dataDir), durationLabel(cfg.evictAfter))
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("relay: %v", err)
	}
}

// hub owns every resident room and the (optional) on-disk append log.
type hub struct {
	mu     sync.Mutex
	rooms  map[string]*room
	cfg    config
	limits *ipLimiter
}

type room struct {
	mu         sync.Mutex
	peers      map[*peer]struct{}
	log        [][]byte // opaque encrypted blobs, replayed to new peers
	logBytes   int64
	lastActive time.Time
	evicted    bool      // set by the sweeper; joiners must take a fresh instance
	loadOnce   sync.Once // lazy disk load, at most once per residency
}

type peer struct {
	conn *websocket.Conn
	send chan []byte
}

func newHub(cfg config) *hub {
	return &hub{
		rooms:  make(map[string]*room),
		cfg:    cfg,
		limits: newIPLimiter(cfg.maxConnsPerIP, cfg.roomCreatesPerIPHour),
	}
}

// join returns the room plus a snapshot of its catch-up log, registering p
// atomically with the eviction check so the sweeper can never evict a room
// between lookup and registration.
func (h *hub) join(name, ip string, p *peer) (*room, [][]byte, error) {
	for {
		rm, err := h.acquireRoom(name, ip)
		if err != nil {
			return nil, nil, err
		}
		rm.mu.Lock()
		if rm.evicted {
			rm.mu.Unlock()
			continue // swept while we were acquiring; take a fresh instance
		}
		backlog := make([][]byte, len(rm.log))
		copy(backlog, rm.log)
		rm.peers[p] = struct{}{}
		rm.lastActive = time.Now()
		rm.mu.Unlock()
		return rm, backlog, nil
	}
}

// acquireRoom returns the resident room, lazily loading its log from disk on
// the first connect since startup or eviction. A name with no RAM entry and
// no disk log is a brand-new room, charged against ip's creation budget.
func (h *hub) acquireRoom(name, ip string) (*room, error) {
	h.mu.Lock()
	rm, ok := h.rooms[name]
	if !ok {
		if !h.roomOnDisk(name) && !h.limits.allowRoomCreate(ip) {
			h.mu.Unlock()
			return nil, errTooManyRooms
		}
		rm = &room{peers: make(map[*peer]struct{}), lastActive: time.Now()}
		h.rooms[name] = rm
	}
	h.mu.Unlock()

	rm.loadOnce.Do(func() {
		if h.cfg.dataDir == "" {
			return
		}
		if err := h.loadRoom(name, rm); err != nil {
			log.Printf("relay: could not load persisted room: %v", err)
		}
	})
	return rm, nil
}

func (h *hub) handleSync(w http.ResponseWriter, r *http.Request) {
	roomName := r.URL.Query().Get("room")
	if roomName == "" {
		http.Error(w, "missing room", http.StatusBadRequest)
		return
	}

	ip := clientIP(r)
	if !h.limits.acquireConn(ip) {
		http.Error(w, "too many connections from this address", http.StatusTooManyRequests)
		return
	}
	defer h.limits.releaseConn(ip)

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		// The relay is meant to be embedded behind whatever origin hosts the
		// app; families may also self-host. Skip strict origin checks here and
		// rely on the per-family encryption key for actual access control.
		InsecureSkipVerify: true,
	})
	if err != nil {
		return
	}
	conn.SetReadLimit(h.cfg.maxMessageBytes)
	ctx := r.Context()

	p := &peer{conn: conn, send: make(chan []byte, 64)}
	rm, backlog, err := h.join(roomName, ip, p)
	if err != nil {
		conn.Close(websocket.StatusPolicyViolation, "room creation limit reached, try later")
		return
	}

	defer func() {
		rm.mu.Lock()
		delete(rm.peers, p)
		rm.lastActive = time.Now() // idle clock starts at last disconnect
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

	// Signal backlog complete so the client can send a merged checkpoint.
	select {
	case p.send <- []byte{msgSyncEnd}:
	case <-ctx.Done():
		return
	}

	for {
		typ, data, err := conn.Read(ctx)
		if err != nil {
			return
		}
		if typ != websocket.MessageBinary || len(data) == 0 {
			continue
		}
		switch frameType(data) {
		case msgCheckpoint:
			h.compactAndBroadcast(roomName, rm, p, data)
		default:
			if err := h.appendAndBroadcast(roomName, rm, p, data); err != nil {
				conn.Close(websocket.StatusPolicyViolation, "room log full — send a checkpoint")
				return
			}
		}
	}
}

func (h *hub) appendAndBroadcast(roomName string, rm *room, from *peer, blob []byte) error {
	rm.mu.Lock()
	if h.cfg.maxRoomLogBytes > 0 && rm.logBytes+int64(len(blob)) > h.cfg.maxRoomLogBytes {
		rm.mu.Unlock()
		return errRoomLogFull
	}
	rm.log = append(rm.log, blob)
	rm.logBytes += int64(len(blob))
	rm.lastActive = time.Now()
	targets := h.peerTargets(rm, from)
	rm.mu.Unlock()

	if h.cfg.dataDir != "" {
		if err := h.persistAppend(roomName, blob); err != nil {
			log.Printf("relay: persist failed for room: %v", err)
		}
	}

	h.fanout(targets, blob)
	return nil
}

// compactAndBroadcast replaces the room log with one checkpoint frame (log compaction).
func (h *hub) compactAndBroadcast(roomName string, rm *room, from *peer, frame []byte) {
	rm.mu.Lock()
	prev := len(rm.log)
	rm.log = [][]byte{append([]byte(nil), frame...)}
	rm.logBytes = int64(len(frame))
	rm.lastActive = time.Now()
	targets := h.peerTargets(rm, from)
	rm.mu.Unlock()

	if h.cfg.dataDir != "" {
		if err := h.persistRoom(roomName, rm); err != nil {
			log.Printf("relay: compact persist failed for room: %v", err)
		}
	}

	if prev > 1 {
		log.Printf("relay: compacted room %s (%d → 1 entries)", roomName, prev)
	}

	h.fanout(targets, frame)
}

func (h *hub) peerTargets(rm *room, from *peer) []*peer {
	targets := make([]*peer, 0, len(rm.peers))
	for p := range rm.peers {
		if p != from {
			targets = append(targets, p)
		}
	}
	return targets
}

func (h *hub) fanout(targets []*peer, blob []byte) {
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

// --- idle sweeping: RAM eviction + optional disk expiry ---

func (h *hub) sweeper() {
	tick := time.NewTicker(sweepInterval)
	defer tick.Stop()
	for now := range tick.C {
		if h.cfg.evictAfter > 0 {
			if n := h.evictIdle(now); n > 0 {
				h.mu.Lock()
				resident := len(h.rooms)
				h.mu.Unlock()
				log.Printf("relay: evicted %d idle room(s) from RAM (%d resident)", n, resident)
			}
		}
		if h.cfg.expireAfter > 0 && h.cfg.dataDir != "" {
			h.expireIdleFiles(now)
		}
		h.limits.prune()
	}
}

// evictIdle drops peer-less rooms from RAM once idle past evictAfter. Safe
// because the log is already on disk and, even if it weren't, any member's
// device re-seeds the relay with a checkpoint on reconnect (self-healing).
func (h *hub) evictIdle(now time.Time) int {
	h.mu.Lock()
	defer h.mu.Unlock()
	evicted := 0
	for name, rm := range h.rooms {
		rm.mu.Lock()
		if len(rm.peers) == 0 && now.Sub(rm.lastActive) >= h.cfg.evictAfter {
			rm.evicted = true
			delete(h.rooms, name)
			evicted++
		}
		rm.mu.Unlock()
	}
	return evicted
}

// expireIdleFiles deletes room files untouched for expireAfter — "your data
// outlives our servers and dies when you all let it go." Members' devices
// remain the canonical copy and can re-seed at any time.
func (h *hub) expireIdleFiles(now time.Time) {
	entries, err := os.ReadDir(h.cfg.dataDir)
	if err != nil {
		return
	}
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".log" {
			continue
		}
		info, err := e.Info()
		if err != nil || now.Sub(info.ModTime()) < h.cfg.expireAfter {
			continue
		}
		nameBytes, err := base64.URLEncoding.DecodeString(strings.TrimSuffix(e.Name(), ".log"))
		if err != nil {
			continue
		}
		h.mu.Lock()
		_, resident := h.rooms[string(nameBytes)]
		h.mu.Unlock()
		if resident {
			continue // still in RAM; let eviction run first
		}
		if err := os.Remove(filepath.Join(h.cfg.dataDir, e.Name())); err == nil {
			log.Printf("relay: expired idle room file (idle > %s)", h.cfg.expireAfter)
		}
	}
}

// --- optional disk persistence (opaque base64 lines per room) ---

func (h *hub) roomFile(roomName string) string {
	// Hash-free but filesystem-safe: room names are already opaque ids.
	safe := base64.URLEncoding.EncodeToString([]byte(roomName))
	return filepath.Join(h.cfg.dataDir, safe+".log")
}

func (h *hub) roomOnDisk(roomName string) bool {
	if h.cfg.dataDir == "" {
		return false
	}
	_, err := os.Stat(h.roomFile(roomName))
	return err == nil
}

func (h *hub) loadRoom(roomName string, rm *room) error {
	data, err := os.ReadFile(h.roomFile(roomName))
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}
	rm.mu.Lock()
	defer rm.mu.Unlock()
	for _, line := range splitLines(data) {
		if len(line) == 0 {
			continue
		}
		blob, err := base64.StdEncoding.DecodeString(string(line))
		if err != nil {
			continue
		}
		rm.log = append(rm.log, blob)
		rm.logBytes += int64(len(blob))
	}
	return nil
}

func (h *hub) persistAppend(roomName string, blob []byte) error {
	if err := os.MkdirAll(h.cfg.dataDir, 0o755); err != nil {
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

func (h *hub) persistRoom(roomName string, rm *room) error {
	if err := os.MkdirAll(h.cfg.dataDir, 0o755); err != nil {
		return err
	}
	rm.mu.Lock()
	lines := make([]byte, 0, len(rm.log)*128)
	for _, blob := range rm.log {
		lines = append(lines, base64.StdEncoding.EncodeToString(blob)...)
		lines = append(lines, '\n')
	}
	rm.mu.Unlock()
	return os.WriteFile(h.roomFile(roomName), lines, 0o644)
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

// --- env helpers ---

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		log.Printf("relay: bad %s=%q, using %d", key, v, fallback)
		return fallback
	}
	return n
}

func envInt64(key string, fallback int64) int64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		log.Printf("relay: bad %s=%q, using %d", key, v, fallback)
		return fallback
	}
	return n
}

func envDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		log.Printf("relay: bad %s=%q, using %s", key, v, fallback)
		return fallback
	}
	return d
}

func dataDirLabel(d string) string {
	if d == "" {
		return "memory only"
	}
	return d
}

func durationLabel(d time.Duration) string {
	if d == 0 {
		return "never"
	}
	return d.String()
}
