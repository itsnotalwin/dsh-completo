# Contributing to Completo

Thanks for helping. Completo is deliberately small and dependency-free; please
keep it that way.

## Ground rules

- **MIT in, MIT out.** New code and skill text must be compatible with the MIT
  licence. If you port something, add it to `NOTICE`.
- **No DeepSeek marks.** The name, icon and tagline stay neutral. Prose like
  "a community bundle for DeepSeek Harness" is fine.
- **No secrets in the repository.** MCP credentials are read from the
  environment with `!!js process.env.X ?? ''`. Never commit a token, even in an
  example that "looks disabled".
- **Nothing on by default that reaches the network or needs a credential.**
  New MCP rows ship `disabled: true`.

## Before you open a PR

```sh
npm run build     # must print "built dsh-completo <version>: ..."
npm run check     # syntax + patch/env contract + the browser-bundle gate
npm test          # node:test suites
```

All three must pass. If you touched `cordis.patch.yml`, add the row to
`test/patch.test.mjs` too. If you touched `src/client/`, the browser-bundle gate
(`scripts/client.mjs`) runs your code against a stubbed module loader and renders
the page — it fails on an unresolved translation key, so add new strings to
`pageDefinition.en` (or merge them into it) rather than registering a second
dictionary.

## Browser half rules

One package, one browser bundle: `exports["./client"]` must stay a single file,
and everything the browser needs (`theme`, `page`, `providers`) is inlined into
`dist/completo-client.js` by `scripts/build.mjs`. The bundle may only
`require("react")` and `require("react/jsx-runtime")`; the shipped Harness Client
packages are not modules you can import. Exactly one Loader row may name
`dsh-completo` — the client-module registry rejects a package that resolves from
two sources.

## Adding or changing a skill

1. Create `skills/<kebab-case-name>/SKILL.md` with YAML frontmatter:

   ```markdown
   ---
   name: my-skill
   description: One line, in the same voice as the others - what it does and when to use it.
   ---

   # My skill
   ...
   ```

2. Add the name to `SKILL_NAMES` in `src/skills/registry.js` (or
   `src/skills/registry.js` plus the summary in `src/discovery/index.js` if the
   page should list it).
3. Run `npm run build` — it validates the frontmatter, the name grammar and that
   the registry and the directory agree.

Skill text style: short imperative steps, commands on their own lines, no "you
should probably". A skill is a procedure, not an essay — keep it under ~150
lines. If it needs a tool, say which tool and what to do when it is missing.

## Adding an MCP row

Add an entry to `cordis.patch.yml` with its own `id: completo-mcp-<name>`,
`disabled: true`, a pinned package version in `args`, and any secret as
`!!js process.env.<VAR> ?? ''`. Update the README table and
`src/discovery/index.js` `SUMMARY.mcp`, then `npm run build`.

## Reporting

Happy to review. Bugs and ideas: the issue templates in `.github/ISSUE_TEMPLATE/`.
Please say which harness version (`dsh --version`), which OS, and — for anything
involving the theme or the Completo page — whether it happened in the web app or
another app profile.

## Where the work lives upstream

Completo only adds what the harness does not already ship. Before opening a PR,
check `docs/` in the [DeepSeek Harness
repository](https://github.com/deepseek-ai/deepseek-harness) — if a feature is a
shipped plugin ahead of us, the better pull request is usually a one-line row in
`cordis.patch.yml` that enables or configures it.
