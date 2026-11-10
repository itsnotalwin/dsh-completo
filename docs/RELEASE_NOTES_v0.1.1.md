# Completo v0.1.1

The fixed build of the v0.1.0 feature set: same theme, nine skills, five MCP
rows and the Settings → Plugins → Completo page, with three rendering defects
that the first screenshots exposed now fixed.

## What changed since v0.1.0

- **The page's stylesheet is actually applied.** The page attached its CSS with
  a `dataset` write in a place the harness never reads; it now sets the
  `data-plugin` / `data-plugin-css` attributes the shipped settings pages use, so
  the page renders with its real card, spacing and typography.
- **Skill rows and status tags no longer collide.** Skill names are code-styled
  and separated from their one-line description; the on/off tag sits at the end of
  its row instead of running into the row title.
- **Each key row shows its own variable name.** The shell hint under the key
  slots rewrote only the first occurrence of the variable name, so all three rows
  named `GITHUB_TOKEN`; each row now prints its own.
- `scripts/render-page.mjs` renders the shipped bundle to
  `docs/screenshots/completo-page.html`, and CI fails if that render is stale, so
  the README image cannot drift from the code. The README image and the rendered
  page are attached to this release.

## Install

```sh
# pinned tag
dsh plugin --profile my-profile add 'github:itsnotalwin/dsh-completo#v0.1.1'

# or this release's tarball
dsh plugin --profile my-profile add ./dsh-completo-0.1.0.tgz
```

The package version stays `0.1.0` in this release; the git tag carries the fix.
Either path needs Node ≥ 24 and a harness whose `engines.dsh` range matches
(`>=0.2.2-rc.1 <0.3.0`). A git install runs the package's `prepare` script, so a
pnpm that blocks build scripts needs `onlyBuiltDependencies: [dsh-completo]` (or
`allowBuilds: { dsh-completo: true }`) in that profile's `pnpm-workspace.yaml`;
the tarball is already built and needs no permission.

Then check the layers composed and the skills are live:

```sh
dsh --profile my-profile --dump-config | grep completo
```

```jsonc
// ask the agent, or from a headless session:
// "list the skills you can load, then load spec-flow"
```

## Verified on this release

On a freshly initialised harness home, with the tarball attached below installed
into a new profile:

- `--dump-config` shows the `dsh-completo` layer with the plugin row and all five
  MCP rows;
- booting the profile mounts the plugin with no activation failure, and the live
  skill registry lists 9 skills from provider `completo`;
- the `skill` tool returns the full `spec-flow` body (2665 characters) and rejects
  an unknown name;
- the Playwright row registers 25 `mcp__completo-mcp-playwright__*` tools, and
  `browser_navigate` was executed against a real page;
- build, check, browser-bundle gate and 29 tests pass.

Not verified: how the theme looks in a running window (the themes are registered
through the real theme service and contrast-checked, but nobody has looked at
them on screen), and a full model-driven conversation in a headless profile.

## Checksums

```
dsh-completo-0.1.0.tgz
sha256 1c41ebe3b1a1f509ede471e3d8e7a4220f89b6c41d10e7578cdf33f6cdfda206
size   34141 bytes
```

## Attribution

MIT. Completo is a community bundle for DeepSeek Harness and is not affiliated
with DeepSeek. Third-party attribution is in [NOTICE](https://github.com/itsnotalwin/dsh-completo/blob/main/NOTICE).
