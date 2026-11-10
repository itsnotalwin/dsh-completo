---
name: release-checklist
description: Turn a working prototype into something you can hand to someone else — production build, no secrets in the bundle, real error states, and a reproducible way for another person to run it.
---

# Release checklist

"Works on my machine" is the only state before this skill runs. Work top to
bottom; skip a step only by saying which one and why in the final report.

## 1. Clean install proof

```bash
rm -rf node_modules && npm install   # or the project's package manager
npm run build
```

A build that only works on top of an old `node_modules` is not a release. If the
lockfile is missing, commit one; if it is out of date with `package.json`, fix
that first.

## 2. Build purity

- `npm run build` succeeds with no new warnings that you introduced.
- No source maps or dev flags in the production output unless the project wants
  them on purpose.
- The bundle contains no secrets: grep the `dist/` output for anything that looks
  like a key, and confirm every `VITE_*` value is public-safe. A key that
  reaches the browser is leaked even if the UI never shows it.
- Environment variables documented in `.env.example` with names only.

## 3. Runtime behavior under production settings

Serve the built output (`npm run preview`, or `npx serve dist`) and re-check the
primary flow. Development mode hides: minification bugs, HMR-only state, missing
env vars, and 404s on assets with wrong base paths.

Then the three states that break on deploy:

- Empty data (fresh database / first visit) renders an empty state, not a crash.
- A network failure shows an error with a retry, not a blank screen.
- Deep link to a non-root route loads directly (SPA fallback / router base
  configured for the host).

## 4. The handoff note

Write four lines into the README (create one if the project has none):

```text
Run:      npm install && npm run dev        (port 5173)
Build:    npm run build && npm run preview
Env:      copy .env.example → .env, fill <names>
Known:    <anything a new person will trip over>
```

Someone who has never seen the repo should be able to follow those four lines
without asking a question.

## 5. Version and changelog

- Set the version deliberately (`0.1.0` for a first share, bump only what
  changed).
- One CHANGES entry per release: what a user can now do, not a file list.
- Tag the release commit if the project uses tags; do not push anything without
  the user's explicit approval.

## 6. Final report

State, in this order: what was verified by running it, what was verified by
reading it, and what was not verified at all. A release note that claims "tested"
for something only compiled is worse than no note.
