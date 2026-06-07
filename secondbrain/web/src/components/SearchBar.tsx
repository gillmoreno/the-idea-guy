"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { SearchResult } from "@/lib/types";

interface SearchBarProps {
  onSelect: (id: string) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const { searchIndex } = useSecondBrain();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  const search = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const hits = searchIndex.search(q, 12);
    setResults(hits);
    setOpen(true);
  };

  return (
    <div className="search-bar search-icon-wrap">
      <Search size={14} className="search-icon" />
      <input
        className="input search-input"
        placeholder="Search vault…"
        value={query}
        onChange={(e) => search(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <button
              key={r.id}
              className="search-result-item"
              onMouseDown={() => {
                onSelect(r.id);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="search-result-title">{r.title}</div>
              <div className="search-result-snippet">{r.snippet}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
