/**
 * Completo discovery — host half.
 *
 * Completo knows what it installed, so it reports that from a shipped manifest
 * instead of probing the live composition. The browser half renders it on its
 * own Settings page; this side only owns the data.
 */
export const name = "completo-discovery";

/** Everything Completo contributes, as shipped. */
export const SUMMARY = Object.freeze({
  bundle: "dsh-completo",
  tagline: "A vibe-coding workspace for DeepSeek Harness: one theme, nine skills, a small MCP pack.",
  themes: Object.freeze([
    { id: "completo-studio-light", label: "Completo Studio (light)" },
    { id: "completo-studio-dark", label: "Completo Studio (dark)" },
  ]),
  skills: Object.freeze([
    { id: "spec-flow", summary: "Idea to build-ready spec: job, surfaces, data, risky unknowns, done." },
    { id: "prompt-crafting", summary: "Target, behavior, constraints, done signal, scope fence, context." },
    { id: "react-vite-base", summary: "A maintainable Vite app skeleton and its no-browser verify commands." },
    { id: "live-preview", summary: "Drive the running app with the Playwright browser and read the console." },
    { id: "checkpoint-rails", summary: "Commit-per-slice, tag the good states, keep experiments contained." },
    { id: "debug-loop", summary: "Reproduce, read the error, bisect, one hypothesis, prove it." },
    { id: "design-pass", summary: "Spacing rhythm, hierarchy, states, palette via tokens." },
    { id: "release-checklist", summary: "Clean-install build proof and the four-line handoff note." },
    { id: "ship-audit", summary: "Secrets, scaffolding, links, claims - the last five minutes." },
  ]),
  mcp: Object.freeze([
    {
      server: "completo-mcp-playwright",
      title: "Playwright browser",
      enabledByDefault: true,
      what: "A real Chromium the agent can drive: navigate, click, screenshot, read console errors.",
      needs: "Node + npx; downloads Chromium on first use.",
    },
    {
      server: "completo-mcp-chrome-devtools",
      title: "Chrome DevTools",
      enabledByDefault: false,
      what: "Performance traces, network waterfalls and DOM inspection for a page you are debugging.",
      needs: "A local Chrome/Chromium; npx downloads the package.",
    },
    {
      server: "completo-mcp-context7",
      title: "Context7 docs",
      enabledByDefault: false,
      what: "Current library documentation for the exact versions in your project.",
      needs: "Network. Optional CONTEXT7_API_KEY for higher limits.",
    },
    {
      server: "completo-mcp-github",
      title: "GitHub",
      enabledByDefault: false,
      what: "Issues, pull requests and repository reads without leaving the conversation.",
      needs: "GITHUB_TOKEN in the environment, plus Docker.",
    },
    {
      server: "completo-mcp-postgres",
      title: "Postgres (read-only)",
      enabledByDefault: false,
      what: "Run read-only SQL against a dev database to check what the app actually stored.",
      needs: "DATABASE_URL in the environment; upstream package is unmaintained.",
    },
  ]),
});

function apply(_ctx) {
  // Read-only and stateless: the page carries its own copy of SUMMARY (inlined
  // at build time), so the host half only has to exist and be listed.
}

export { apply };

export default { name, apply };
