# Changes

## 0.1.2 — unreleased

Removes the one part of the bundle that could not do what it looked like it did.

### Changed

- **The page stores no keys any more.** The three "Save to the store" boxes for
  `GITHUB_TOKEN`, `CONTEXT7_API_KEY` and `DATABASE_URL` are gone, along with the
  `remote` / `remote.credentials` services the bundle used to inject. The harness
  already owns model providers and their keys (Settings → Models → *Add model
  provider* → *Custom model API*), and a credential stored there cannot reach an
  MCP child process: the harness strips ambient `*KEY*`/`*TOKEN*`/`*SECRET*`/
  `*PASSWORD*` variables before spawning a server, so only the row's `env:` block
  (read from `process.env` at launch) counts. A box that accepts a key and never
  configures a server is worse than no box.
- The card now documents each variable with the server that reads it and the exact
  shell line, per platform. The Models-page footer card is unchanged.

### Removed

- `createSecretsController`, the password inputs, the key state tags and every
  `credentials/*` call. The bundle is ~7 kB smaller and its inject list is just
  `["theme", "slots", "locale"]`.

### Verified

- The browser gate and `test/invariants.test.mjs` now assert the absence: no
  `remote` inject, no password input, no credential access in the built code.

## 0.1.0 — unreleased

First public cut. Built and verified against DeepSeek Harness `0.2.2-rc.1`.

### Added

- **Completo Studio theme** (`src/client/theme.js`): light and dark variants
  registered with the harness theme service, 14 tokens each, mint accent on warm
  paper. Contrast-checked (`scripts/contrast.mjs`).
- **Nine skills** (`skills/`): `spec-flow`, `prompt-crafting`,
  `react-vite-base`, `live-preview`, `checkpoint-rails`, `debug-loop`,
  `design-pass`, `release-checklist`, `ship-audit`, served through a provider
  shaped like the shipped `dsh-skill-office` plugin.
- **MCP pack** (`cordis.patch.yml`): Playwright (on), Chrome DevTools, Context7,
  GitHub and Postgres (off). Secrets only via `!!js process.env.*`.
- **Completo page** (`src/client/page.js`): Settings → Plugins → *Completo* — what
  is installed, which MCP rows are on, and how to remove the bundle.
- **Providers & API keys card** (`src/client/providers.js`): points at the
  harness's own Settings → Models → *Add model provider* → *Custom model API*
  flow, and documents the three environment variables Completo's MCP rows read
  with the exact shell line for each. It is guidance only: the harness owns model
  providers and their keys, so Completo keeps no key store and renders no input
  for a secret. The same short summary is mirrored at the bottom of
  Settings → Models.
- Dependency-free build (`scripts/build.mjs`) and three gates: the browser-bundle
  gate (`scripts/client.mjs`, runs the real bundle against a stubbed module
  loader and renders the page), `scripts/check.mjs`, and `node --test test/`.

### Verified

- Fresh harness home, profile created with `dsh plugin --profile smoke add
  ./dsh-completo`; booting through the harness boot path activates the plugin, the
  skill registry lists 9 `completo` skills, and the Playwright row contributes 25
  `mcp__completo-mcp-playwright__*` tools.
- **Skill calling**: the model-facing `skill` tool executes — `skill({name:
  "spec-flow"})` returns the full `SKILL.md` body (2898 characters) from the
  pack directory in 466 ms, and an unknown name is rejected.
- **Tool calling**: `mcp__completo-mcp-playwright__browser_navigate` executed in a
  live boot, in 8273 ms, against `https://example.com` and returned the real page
  title.
- **Composition**: the harness's real client-module registry resolves the bundle,
  the composed graph lists it exactly once, `import("dsh-completo")` yields
  `{name: "completo", inject: ["theme","slots","locale"], apply}`, and applying it
  registers both themes, the one `completo.discovery` dictionary and the Settings
  tab.
- **No credential surface**: the bundle injects no `remote` service, renders no
  password input and calls no `credentials/*` method (asserted against the built
  bundle by the gate and by `test/invariants.test.mjs`).

### Known limitations

- The web UI does not ship a picker for third-party themes; see README
  ("Switching the theme on").
- Fonts (Aptos) are suggested, never applied or bundled — the client theme
  service exposes no font-family setter to plugins.
- An MCP row's key must come from the launching shell: the harness drops ambient
  `*KEY*`/`*TOKEN*`/`*SECRET*`/`*PASSWORD*` variables before spawning an MCP child,
  and the credential store is not part of the spawn path, so the row's `env:` block
  only sees `process.env` at launch. This is why the page documents the export line
  instead of offering an input box.
- No Projects-style sidebar (planned for 0.2.0), no plugin-browser restyling, no
  icon replacement set.
- The theme's on-screen appearance in a running web UI has not been verified on
  a screen from this machine; only its registration, token set and contrast are
  verified.
