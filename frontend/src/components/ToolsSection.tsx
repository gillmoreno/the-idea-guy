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

type StackItem = {
  name: string;
  role: string;
};

type StackGroup = {
  category: string;
  items: StackItem[];
};

type WorkflowStep = {
  step: number;
  title: string;
  description: string;
};

type CursorRule = {
  id: string;
  title: string;
  description: string;
};

type ToolsData = {
  stack: StackGroup[];
  workflow: WorkflowStep[];
  cursorRules: CursorRule[];
};

const fallbackTools: ToolsData = {
  stack: [
    {
      category: "Frontend",
      items: [
        { name: "Next.js 15", role: "Static export, App Router" },
        { name: "React 19", role: "UI components" },
        { name: "TypeScript", role: "Type safety" },
      ],
    },
    {
      category: "Backend",
      items: [
        { name: "Go 1.22", role: "Small JSON API" },
        { name: "nginx", role: "Reverse proxy + static files" },
      ],
    },
    {
      category: "Ship",
      items: [
        { name: "Docker", role: "One monolith image" },
        { name: "Cursor", role: "AI pair-programmer" },
      ],
    },
  ],
  workflow: [
    {
      step: 1,
      title: "Start with the idea",
      description: "Filter through: useful over hype? Can one person ship it? Worth teaching in public?",
    },
    {
      step: 2,
      title: "Build with Cursor",
      description: "Project rules keep the AI on brand. Composer for features, agent for exploration.",
    },
    {
      step: 3,
      title: "Ship the smallest useful thing",
      description: "Static first, API only when content must be live. One Docker image to deploy.",
    },
    {
      step: 4,
      title: "Teach in public",
      description: "Post the process on X — hook, workflow, what shipped, what I learned, artifacts.",
    },
  ],
  cursorRules: [
    {
      id: "minimal-scope",
      title: "Minimal scope",
      description: "Smallest correct diff. No unrelated changes, no over-engineering.",
    },
    {
      id: "match-conventions",
      title: "Match conventions",
      description: "Read surrounding code first. Reuse patterns — additions should look native.",
    },
    {
      id: "docs-in-folder",
      title: "Document in docs_and_changelog",
      description: "New features and changes get a doc in the project docs folder.",
    },
    {
      id: "ship-dont-perfect",
      title: "Ship, don't perfect",
      description: "Useful tests only. Comments for non-obvious logic. Bias toward shipping.",
    },
  ],
};

export function ToolsSection() {
  const [tools, setTools] = useState<ToolsData>(fallbackTools);
  const [loadedFromApi, setLoadedFromApi] = useState(false);

  useEffect(() => {
    fetchJSON<ToolsData>("/api/tools")
      .then((data) => {
        setTools(data);
        setLoadedFromApi(true);
      })
      .catch(() => {
        setLoadedFromApi(false);
      });
  }, []);

  return (
    <section className="section" id="tools">
      <div className="section-header">
        <h2>Tools &amp; workflow</h2>
        <p>
          Exact stack and setup behind every build — steal what helps
          {loadedFromApi ? " — live from the Go API." : " — showing defaults until the API is up."}
        </p>
      </div>

      <div className="tools-grid">
        <div className="tools-panel">
          <h3 className="tools-panel-title">Stack</h3>
          <div className="stack-groups">
            {tools.stack.map((group) => (
              <div className="stack-group" key={group.category}>
                <h4>{group.category}</h4>
                <ul className="stack-list">
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <span className="stack-name">{item.name}</span>
                      <span className="stack-role">{item.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="tools-panel">
          <h3 className="tools-panel-title">Workflow</h3>
          <ol className="workflow-list">
            {tools.workflow.map((step) => (
              <li className="workflow-step" key={step.step}>
                <span className="workflow-step-number">
                  {String(step.step).padStart(2, "0")}
                </span>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="tools-panel tools-panel-full">
        <h3 className="tools-panel-title">Cursor rules</h3>
        <p className="tools-panel-intro">
          Project rules that keep AI-assisted building on track. Copy and adapt for your own repos.
        </p>
        <div className="grid grid-3">
          {tools.cursorRules.map((rule) => (
            <article className="card cursor-rule-card" key={rule.id}>
              <h4>{rule.title}</h4>
              <p>{rule.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
