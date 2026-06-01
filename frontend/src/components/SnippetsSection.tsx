"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error("API unavailable");
  }
  return response.json();
}

type Snippet = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
};

const fallbackSnippets: Snippet[] = [
  {
    id: "cursor-rules",
    title: "Cursor Rules for AI-Assisted Building",
    description:
      "How to write project rules so your AI pair-programmer stays on brand and on task.",
    tags: ["cursor", "ai", "workflow"],
  },
  {
    id: "one-person-stack",
    title: "The One-Person AI Stack",
    description:
      "Static frontend, small API, Docker monolith — a practical stack for shipping solo.",
    tags: ["architecture", "docker", "solo"],
  },
  {
    id: "static-first",
    title: "Static First, Dynamic When Needed",
    description:
      "Start with static export for speed. Add API endpoints only when content must be live.",
    tags: ["nextjs", "performance"],
  },
];

export function SnippetsSection() {
  const [snippets, setSnippets] = useState<Snippet[]>(fallbackSnippets);
  const [loadedFromApi, setLoadedFromApi] = useState(false);

  useEffect(() => {
    fetchJSON<Snippet[]>("/api/snippets")
      .then((data) => {
        setSnippets(data);
        setLoadedFromApi(true);
      })
      .catch(() => {
        setLoadedFromApi(false);
      });
  }, []);

  return (
    <section className="section" id="snippets">
      <div className="section-header">
        <h2>Snippets</h2>
        <p>
          Bite-sized ideas and patterns
          {loadedFromApi ? " — live from the Go API." : " — showing defaults until the API is up."}
        </p>
      </div>
      <div className="grid grid-3">
        {snippets.map((snippet) => (
          <article className="card" key={snippet.id}>
            <h3>{snippet.title}</h3>
            <p>{snippet.description}</p>
            <div className="tag-list">
              {snippet.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
