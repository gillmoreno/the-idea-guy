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

type IdeaStatus = "exploring" | "building" | "shipped" | "parked";

type Idea = {
  id: string;
  title: string;
  why: string;
  status: IdeaStatus;
  link?: string;
};

const fallbackIdeas: Idea[] = [
  {
    id: "idea-validator",
    title: "Idea Validator",
    why: "Score any idea against the three principles before you build — useful filter, great demo.",
    status: "building",
  },
  {
    id: "how-to-guides",
    title: "How-to guides",
    why: "Step-by-step Cursor and agent walkthroughs people can copy on their first solo ship.",
    status: "exploring",
  },
  {
    id: "the-idea-guy",
    title: "The Idea Guy site",
    why: "Living portfolio + knowledge base that proves one person can ship end-to-end with AI leverage.",
    status: "shipped",
    link: "#builds",
  },
  {
    id: "prompt-library",
    title: "Prompt library",
    why: "Curated prompts for common builder tasks — high steal-value for X traffic.",
    status: "parked",
  },
];

const statusLabels: Record<IdeaStatus, string> = {
  exploring: "Exploring",
  building: "Building",
  shipped: "Shipped",
  parked: "Parked",
};

export function IdeaLogSection() {
  const [ideas, setIdeas] = useState<Idea[]>(fallbackIdeas);
  const [loadedFromApi, setLoadedFromApi] = useState(false);

  useEffect(() => {
    fetchJSON<Idea[]>("/api/ideas")
      .then((data) => {
        setIdeas(data);
        setLoadedFromApi(true);
      })
      .catch(() => {
        setLoadedFromApi(false);
      });
  }, []);

  return (
    <section className="section" id="ideas">
      <div className="section-header">
        <h2>Idea log</h2>
        <p>
          Public thinking — what I&apos;m exploring, building, and parking
          {loadedFromApi ? " — live from the Go API." : " — showing defaults until the API is up."}
        </p>
      </div>
      <div className="idea-list">
        {ideas.map((idea) => (
          <article className="idea-row" key={idea.id}>
            <div className="idea-row-main">
              <div className="idea-row-header">
                <h3>{idea.title}</h3>
                <span className={`idea-status idea-status-${idea.status}`}>
                  {statusLabels[idea.status]}
                </span>
              </div>
              <p>{idea.why}</p>
            </div>
            {idea.link ? (
              <a className="idea-link" href={idea.link}>
                View →
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
