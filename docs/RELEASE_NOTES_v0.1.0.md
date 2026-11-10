# Completo v0.1.0

> A community bundle for **DeepSeek Harness** that makes it a vibe-coding
> workspace: one calm theme, a nine-skill build loop, and a small MCP pack that
> lets the agent actually look at the app it is building.
>
> **Not affiliated with DeepSeek.** "DeepSeek Harness" is named only to say what
> this plugs into.

Built and verified against DeepSeek Harness `0.2.2-rc.1` (`engines.dsh`:
`>=0.2.2-rc.1 <0.3.0`). MIT, no runtime dependencies.

## Install

### 1. Release tarball (no build step — this is the easiest path)

```sh
curl -LO https://github.com/itsnotalwin/dsh-completo/releases/download/v0.1.0/dsh-completo-0.1.0.tgz
dsh plugin --profile my-profile add ./dsh-completo-0.1.0.tgz
```

`dist/` ships inside the tarball, so nothing is built on your machine.

### 2. Pinned git tag (builds on install)

```sh
dsh plugin --profile my-profile add 'github:itsnotalwin/dsh-completo#v0.1.0'
```

Installing from git runs `prepare` (`node scripts/build.mjs`). pnpm will refuse
until you allow it; it prints the exact key. Add it to your profile's
`pnpm-workspace.yaml` and re-run:

```yaml
onlyBuiltDependencies:
  - dsh-completo
```

### Check it loaded

```sh
dsh --profile my-profile --dump-config | grep -A1 'completo'
```

You should see one `completo` row plus `completo-mcp-playwright` and four
disabled `completo-mcp-*` rows.

## What's inside

| Part | On by default |
| --- | --- |
| **Completo Studio** theme — warm paper + mint, light and dark, registered with the theme service | yes (pick it under Appearance; see README for switching it on) |
| **Nine skills** — `spec-flow`, `prompt-crafting`, `react-vite-base`, `live-preview`, `checkpoint-rails`, `debug-loop`, `design-pass`, `release-checklist`, `ship-audit` | yes |
| **Playwright browser MCP** — the agent navigates, clicks, screenshots and reads console errors | yes (downloads Chromium on first use) |
| **Chrome DevTools, Context7, GitHub, Postgres MCPs** | off — switch on your own |
| **Completo page** — Settings → Plugins → *Completo*, incl. where to add providers and API keys | yes |

## Verified in v0.1.0

- Fresh harness home, profile created with `dsh plugin --profile … add`, boot:
  plugin row active; **9 Completo skills** in the live registry.
- **Skill calling**: `skill({ name: "spec-flow" })` returned its full
  `SKILL.md` body (2898 characters) in about 600 ms on a live boot; an unknown
  name was rejected.
- **Tool calling**: `mcp__completo-mcp-playwright__browser_navigate` executed in
  8273 ms against `https://example.com` and returned the real page title.
- **Client half**: the harness's real client-module registry accepts the single
  bundle, the composed graph lists `dsh-completo` once, and applying it
  registers both themes (14 tokens each), one 32-string dictionary and the
  Settings → Plugins tab.
- The release tarball was installed into a **fresh profile from scratch** and
  passed the same boot checks.

## Known limitations

- The theme's **on-screen look** in a running web UI is not verified (no browser
  session on the build machine): registration, tokens and WCAG contrast are
  verified, pixels are not. Fonts (Aptos) are suggested, never applied or
  bundled.
- A key saved from the Completo providers card does **not** reach an MCP child by
  itself — the harness strips `KEY`/`TOKEN`/`SECRET`/`PASSWORD` variables from
  the child environment. Export the variable in the shell that launches the
  harness (the card prints the exact line).
- No Projects-style sidebar yet (v0.2.0), no restyling of the harness's own
  plugin browser, no icon replacement set.
