# Completo v0.1.2

One change, and it removes something rather than adding it.

## The MCP key boxes are gone

v0.1.0 and v0.1.1 offered three "Save to the store" boxes on the Completo page,
one each for `GITHUB_TOKEN`, `CONTEXT7_API_KEY` and `DATABASE_URL`. They could
accept a key and still leave the server unconfigured, which is worse than having
no box at all:

- An MCP server is a **child process**.
- The harness strips every ambient variable matching `KEY|PASSWORD|SECRET|TOKEN`
  before spawning it, so only the row's own `env:` block reaches it.
- That block reads `process.env` when the row starts. The credential store those
  boxes wrote to is not part of the spawn path, and no read path returns a stored
  value to the page either.

So the page now documents the path that actually works:

```sh
# PowerShell
$env:GITHUB_TOKEN = 'ghp_...'
# POSIX
export GITHUB_TOKEN=ghp_...
```

Restart DeepSeek Harness, switch the row on, and it starts with the variable set.
The card prints the exact line for each of the three variables, next to the server
that reads it.

Model providers and their API keys are unaffected: those were always the harness's
own **Settings → Models → Add model provider → Custom model API**, and the card
still points at them.

The Playwright row — the one that ships enabled — needs no key at all.

## What the bundle no longer touches

`inject` is now `["theme", "slots", "locale"]`. No `remote`, no
`remote.credentials`, no password input, no credential call. The browser bundle is
about 7 kB smaller. The gate and `test/invariants.test.mjs` assert that absence
against the built bundle, so it cannot quietly come back.

## Verified on this release

Installed from this exact tarball into a fresh harness home and booted through the
harness boot path:

- profile `dsh.profile.bundles` = `["@deepseek-ai/dsh-base", "dsh-completo"]`, the
  `completo` row and five `completo-mcp-*` rows compose;
- `49` skills listed, `9` from provider `completo`;
- **skill calling**: `skill({name: "ship-audit"})` returned the full `SKILL.md`
  body (2585 characters) in 1091 ms; an unknown name is rejected;
- **tool calling**: `mcp__completo-mcp-playwright__browser_navigate` executed in
  8182 ms against `https://example.com` and returned the real page title;
- `25` `mcp__completo-mcp-playwright__*` tools visible.

## Install

```sh
dsh plugin --profile my-profile add 'github:itsnotalwin/dsh-completo#v0.1.2'
```

Older profiles that already have v0.1.0 or v0.1.1 installed can simply re-add the
pinned tag; nothing in the profile patch changed.

```sh
dsh plugin --profile my-profile add ./dsh-completo-0.1.2.tgz
```

sha256 `33127d744bfae8243558148a1e5fee5b77eb4c97bfb91bf88fb9df6a9df5fbd7`,
33041 bytes, 23 files.

## Still not done (unchanged)

- No model provider list or key store in Completo — the harness owns both.
- Fonts (Aptos) are suggested in the stack, never applied or bundled; the client
  theme service exposes no font-family setter to plugins.
- No theme picker in the web UI, so Completo Studio is registered but you must
  select it under Appearance.
- No Projects-style sidebar yet (planned for 0.2.0).

Not affiliated with DeepSeek. "DeepSeek Harness" is named only to say what this
plugs into.
