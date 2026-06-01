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

type BuildLinks = {
  demo?: string;
  thread?: string;
  repo?: string;
};

type Build = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  learning?: string;
  links?: BuildLinks;
  shippedAt?: string;
  status: "live" | "shipped" | "building" | "archived";
};

const fallbackBuilds: Build[] = [
  {
    id: "the-idea-guy",
    title: "The Idea Guy",
    description:
      "Personal brand site and knowledge base — static Next.js, Go API, nginx, one Docker image.",
    tags: ["nextjs", "go", "docker", "nginx"],
    learning:
      "Static export plus a tiny API is enough for a solo brand site. Ship the monolith first, add sections as you go.",
    links: {
      demo: "/",
    },
    shippedAt: "2026-05",
    status: "live",
  },
];

const statusLabels: Record<Build["status"], string> = {
  live: "Live",
  shipped: "Shipped",
  building: "Building",
  archived: "Archived",
};

export function BuildsSection() {
  const [builds, setBuilds] = useState<Build[]>(fallbackBuilds);
  const [loadedFromApi, setLoadedFromApi] = useState(false);

  useEffect(() => {
    fetchJSON<Build[]>("/api/builds")
      .then((data) => {
        setBuilds(data);
        setLoadedFromApi(true);
      })
      .catch(() => {
        setLoadedFromApi(false);
      });
  }, []);

  return (
    <section className="section" id="builds">
      <div className="section-header">
        <h2>What I&apos;ve shipped</h2>
        <p>
          Real experiments from one person with AI as leverage — each with a
          key learning
          {loadedFromApi ? " — live from the Go API." : " — showing defaults until the API is up."}
        </p>
      </div>
      <div className="grid grid-3">
        {builds.map((build) => (
          <article className="card build-card" key={build.id}>
            <div className="build-card-header">
              <h3>{build.title}</h3>
              <span className={`build-status build-status-${build.status}`}>
                {statusLabels[build.status]}
              </span>
            </div>
            <p>{build.description}</p>
            {build.learning ? (
              <p className="build-learning">
                <span className="build-learning-label">Key learning</span>
                {build.learning}
              </p>
            ) : null}
            <div className="tag-list">
              {build.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="build-card-footer">
              {build.shippedAt ? (
                <span className="build-shipped-at">Shipped {build.shippedAt}</span>
              ) : (
                <span />
              )}
              {build.links ? (
                <div className="build-links">
                  {build.links.demo ? (
                    <a href={build.links.demo}>Demo</a>
                  ) : null}
                  {build.links.thread ? (
                    <a href={build.links.thread} target="_blank" rel="noopener noreferrer">
                      Thread
                    </a>
                  ) : null}
                  {build.links.repo ? (
                    <a href={build.links.repo} target="_blank" rel="noopener noreferrer">
                      Repo
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
