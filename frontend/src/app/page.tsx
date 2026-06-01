import { BuildsSection } from "@/components/BuildsSection";
import { IdeaLogSection } from "@/components/IdeaLogSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SnippetsSection } from "@/components/SnippetsSection";
import { ToolsSection } from "@/components/ToolsSection";

const method = [
  {
    title: "Spot the problem",
    body: "Find something people actually struggle with today — a real problem worth solving, not a hype-driven demo.",
  },
  {
    title: "Explain how it's solved now",
    body: "Map the current solutions richly — with data, charts, and context — and show honestly where they fall short.",
  },
  {
    title: "Ship a meaningfully better approach",
    body: "Use modern AI as leverage to build something better: simpler, more beautiful, more useful, or more powerful.",
  },
  {
    title: "Teach the process publicly",
    body: "Share the whole journey — the problem, the research, the build, and the lessons — so others can do it too.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <span className="eyebrow">It&apos;s time for the idea</span>
          <h1>The Idea Guy</h1>
          <p>
            I find real problems, dig into how people solve them today, then
            show how one person with modern AI can do it better — and teach the
            whole process in public.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#builds">
              See what I&apos;ve shipped
            </a>
            <a className="button button-secondary" href="#snippets">
              Browse snippets
            </a>
            <a
              className="button button-secondary"
              href="https://x.com/gill_moreno"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow on X
            </a>
          </div>
        </section>

        <section className="section" id="method">
          <div className="section-header">
            <h2>The lens</h2>
            <p>
              One clear way of working — no scattered fronts. Every build on
              this site runs through the same four steps.
            </p>
          </div>
          <div className="pillars">
            {method.map((step, index) => (
              <article className="pillar" key={step.title}>
                <span className="pillar-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <BuildsSection />

        <SnippetsSection />

        <IdeaLogSection />

        <ToolsSection />

        <section className="section">
          <div className="section-header">
            <h2>Coming soon</h2>
            <p>
              Step-by-step how-to guides and deeper walkthroughs. The monolith
              is live — tutorials are next.
            </p>
          </div>
          <div className="grid grid-3">
            <article className="card">
              <h3>Cursor deep dives</h3>
              <p>Rules, Composer workflows, and agent patterns for solo builders.</p>
            </article>
            <article className="card">
              <h3>Shipping solo</h3>
              <p>From idea to Docker deploy — the full one-person playbook.</p>
            </article>
            <article className="card">
              <h3>Idea Validator</h3>
              <p>Interactive demo that runs an idea through the four-step lens.</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
