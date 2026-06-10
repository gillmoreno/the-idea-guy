package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// budget is the hard monthly spend cap — the proxy's only state. It makes the
// worst-case AI bill a chosen number: once spent, /generate returns
// budget_exhausted until the calendar month rolls over. Optionally persisted
// so restarts don't reset the meter.
type budget struct {
	mu       sync.Mutex
	capUSD   float64
	priceIn  float64 // $ per 1M input tokens
	priceOut float64 // $ per 1M output tokens
	file     string  // empty = memory only

	month    string // "2006-01", UTC
	spentUSD float64
}

type budgetState struct {
	Month    string  `json:"month"`
	SpentUSD float64 `json:"spent_usd"`
}

func newBudget(cfg config) *budget {
	b := &budget{
		capUSD:   cfg.monthlyBudgetUSD,
		priceIn:  cfg.priceInUSD,
		priceOut: cfg.priceOutUSD,
		month:    currentMonth(),
	}
	if cfg.dataDir != "" {
		b.file = filepath.Join(cfg.dataDir, "budget.json")
		if data, err := os.ReadFile(b.file); err == nil {
			var st budgetState
			if json.Unmarshal(data, &st) == nil && st.Month == b.month {
				b.spentUSD = st.SpentUSD
			}
		}
	}
	return b
}

func (b *budget) exhausted() bool {
	if b.capUSD <= 0 {
		return false
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.rollover()
	return b.spentUSD >= b.capUSD
}

func (b *budget) add(promptTokens, completionTokens int64) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.rollover()
	b.spentUSD += float64(promptTokens)/1e6*b.priceIn + float64(completionTokens)/1e6*b.priceOut
	if b.file != "" {
		st := budgetState{Month: b.month, SpentUSD: b.spentUSD}
		data, _ := json.Marshal(st)
		if err := os.MkdirAll(filepath.Dir(b.file), 0o755); err == nil {
			if err := os.WriteFile(b.file, data, 0o644); err != nil {
				log.Printf("genproxy: budget persist failed: %v", err)
			}
		}
	}
}

func (b *budget) rollover() {
	if m := currentMonth(); m != b.month {
		b.month = m
		b.spentUSD = 0
	}
}

func currentMonth() string {
	return time.Now().UTC().Format("2006-01")
}
