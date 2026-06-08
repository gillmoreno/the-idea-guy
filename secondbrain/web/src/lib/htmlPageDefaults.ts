export { buildHtmlBlockSrcDoc as buildHtmlPageSrcDoc } from "./htmlBlockExtension";

export const DEFAULT_PAGE_HTML = `<header class="hero">
  <p class="eyebrow">HTML page</p>
  <h1>Untitled page</h1>
  <p class="lede">Ask AI to design this entire post — layout, colors, and content from your vault.</p>
</header>
<main class="content">
  <section class="card">
    <h2>Try it</h2>
    <p>Open the AI panel and say: <em>Build a dashboard from my workout notes.</em></p>
  </section>
</main>`;

export const DEFAULT_PAGE_CSS = `:root {
  --bg: #0b0f17;
  --card: #151d2e;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --accent: #2dd4bf;
  --accent2: #818cf8;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(45, 212, 191, 0.15), transparent),
    var(--bg);
  color: var(--text);
  line-height: 1.55;
}
.hero { padding: 2.5rem 2rem 1.5rem; max-width: 960px; margin: 0 auto; width: 100%; }
.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.5rem;
}
.hero h1 { font-size: 2rem; margin: 0 0 0.5rem; line-height: 1.15; }
.lede { color: var(--muted); margin: 0; font-size: 1.05rem; }
.content { padding: 0 2rem 2.5rem; max-width: 960px; margin: 0 auto; width: 100%; }
.card {
  background: var(--card);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
}
.card h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.card p { margin: 0; color: var(--muted); }
em { color: var(--accent2); font-style: normal; }`;
