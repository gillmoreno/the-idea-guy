#!/usr/bin/env node
/**
 * Schema UI quality gate — run against /schema/preview while dev server is up.
 *
 * Usage:
 *   npm run dev   # terminal 1
 *   npm run qa:schema-ui   # terminal 2
 *
 * Exit 0 = pass, 1 = fail (overlap, tiny text, clipped content).
 */
import { chromium } from "playwright";

const BASE_URL = process.env.ROOMS_QA_URL ?? "http://localhost:3300";
const PREVIEW_PATH = "/schema/preview";

const OVERLAP_SCRIPT = () => {
  const MIN_FONT_PX = 12;
  const MIN_GAP_PX = 2;

  function intersects(a, b) {
    return !(
      a.right <= b.left + MIN_GAP_PX ||
      a.left >= b.right - MIN_GAP_PX ||
      a.bottom <= b.top + MIN_GAP_PX ||
      a.top >= b.bottom - MIN_GAP_PX
    );
  }

  function visibleTextElements(root) {
    const selectors = [
      ".schema-record__title",
      ".schema-record__emoji",
      ".schema-record__pitch",
      ".schema-record__meta",
      ".schema-record__vote",
      ".schema-record__status",
    ];
    const out = [];
    for (const sel of selectors) {
      root.querySelectorAll(sel).forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") return;
        const opacity = parseFloat(style.opacity);
        if (opacity < 0.1) return;
        out.push({
          el,
          selector: sel,
          text: (el.textContent ?? "").trim().slice(0, 80),
          rect: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
          fontSize: parseFloat(style.fontSize) || 0,
        });
      });
    }
    return out;
  }

  function isClipped(el) {
    return el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2;
  }

  const fixtures = document.querySelectorAll("[data-schema-fixture]");
  const issues = [];

  fixtures.forEach((fixture) => {
    const fixtureId = fixture.getAttribute("data-schema-fixture") ?? "unknown";
    const elements = visibleTextElements(fixture);

    for (const el of elements) {
      if (el.fontSize > 0 && el.fontSize < MIN_FONT_PX) {
        issues.push({
          type: "font-too-small",
          fixture: fixtureId,
          selector: el.selector,
          text: el.text,
          fontSize: el.fontSize,
        });
      }
    }

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        if (intersects(a.rect, b.rect)) {
          const overlapW =
            Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
          const overlapH =
            Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
          if (overlapW > 4 && overlapH > 4) {
            issues.push({
              type: "overlap",
              fixture: fixtureId,
              a: { selector: a.selector, text: a.text },
              b: { selector: b.selector, text: b.text },
              overlapPx: { w: Math.round(overlapW), h: Math.round(overlapH) },
            });
          }
        }
      }
    }

    fixture.querySelectorAll(".schema-record__title").forEach((titleEl) => {
      if (isClipped(titleEl)) {
        issues.push({
          type: "clipped",
          fixture: fixtureId,
          selector: ".schema-record__title",
          text: titleEl.textContent?.trim(),
        });
      }
    });
  });

  return {
    fixtureCount: fixtures.length,
    elementCount: fixtures.length
      ? visibleTextElements(fixtures[0].closest("[data-schema-preview-root]") ?? document.body)
          .length
      : 0,
    issues,
  };
};

async function runThemeChecks(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, theme);
  await page.waitForTimeout(150);
  return page.evaluate(OVERLAP_SCRIPT);
}

async function main() {
  const url = `${BASE_URL}${PREVIEW_PATH}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  try {
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    if (!res?.ok()) {
      console.error(`Failed to load ${url} — is \`npm run dev\` running?`);
      process.exit(1);
    }

    // The persona onboarding gate fronts every route in a fresh profile —
    // create a throwaway persona, then return to the preview page.
    await page.waitForTimeout(1_500);
    if (await page.getByText("Create persona").count()) {
      await page.getByPlaceholder("Gil").fill("QA Bot");
      await page.getByRole("button", { name: "Create persona" }).click();
      await page.waitForTimeout(1_000);
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    }

    await page.waitForSelector("[data-schema-fixture]", { timeout: 10_000 });

    const themes = ["classic", "paper", "glow"];
    const allIssues = [];

    for (const theme of themes) {
      const result = await runThemeChecks(page, theme);
      for (const issue of result.issues) {
        allIssues.push({ ...issue, theme });
      }
      console.log(`Theme ${theme}: ${result.issues.length} issue(s), fixtures ${result.fixtureCount}`);
    }

    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../qa-output");
    fs.mkdirSync(dir, { recursive: true });
    const shotPath = path.join(dir, "schema-preview-fail.png");
    if (allIssues.length > 0) {
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`Screenshot: ${shotPath}`);
    }

    if (allIssues.length === 0) {
      console.log("✓ Schema UI quality gate passed (no overlaps, readable text).");
      process.exit(0);
    }

    console.error("\n✗ Schema UI quality gate FAILED:\n");
    for (const issue of allIssues) {
      console.error(JSON.stringify(issue, null, 2));
    }
    console.error("\nFix RecordCard / globals.css, then re-run: npm run qa:schema-ui");
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
