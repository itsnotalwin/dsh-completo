---
name: ship-audit
description: The last five minutes before someone else sees the app — a short, ordered sweep for leaked secrets, leftover scaffolding, broken links, dead code, and claims the code does not support.
---

# Ship audit

A narrow, mechanical audit to run *after* `release-checklist` and right before
handing the app over. It finds the things that embarrass people, in the order
they embarrass them.

## 1. Secrets (first, always)

- Search the tree for key-shaped strings: `sk-`, `ghp_`, `gho_`, `AKIA`,
  `-----BEGIN`, `Bearer `, `password=`, `token=`.
- Confirm `.env*` is ignored and no key was ever committed:
  `git log -p --all -- .env* | head` and a search of the diff history for the
  key prefixes above.
- Rotate anything that was committed, even if it is also removed in a later
  commit. Removing the value does not un-leak it.

## 2. Leftover scaffolding

- `console.log` / `debugger` / `alert(` in shipped code (keep intentional logs,
  but say why).
- Placeholder content: lorem ipsum, "TODO", "FIXME", sample names, test
  accounts, `example.com` links in the UI.
- Commented-out blocks bigger than a few lines — delete, git keeps the history.
- Dev-only routes, debug panels, feature flags left on.

## 3. Links, assets, and routes

- Every link and button goes somewhere: no `href="#"` left where a real action
  was promised.
- Images and fonts load from the deployed paths (a locally-served `/src/...`
  asset 404s in the build).
- The primary flow works from a deep link, in a fresh browser profile, with
  storage empty.

## 4. User-facing text

- Error messages say what happened and what to do; they do not show raw
  exceptions or stack traces.
- No internal names in the UI (table names, endpoint paths, ticket numbers).
- Titles, favicon, and empty-state copy match the app's actual name.

## 5. Claims versus code

Read your own handoff/README and mark each claim: verified by running it,
verified by reading it, or unverified. Delete or soften every unverified claim.
Specifically check: "works on mobile", "tested", "secure", "fast",
"accessible" — those are exactly the words that get audited by the recipient.

## 6. Report

Output a short list, not an essay:

```text
Blocking   <must fix before sharing, or "none">
Fixed      <what you changed during the audit>
Unverified <what you could not check and why>
Note       <anything the recipient should know>
```

If nothing is blocking, say so in one line and stop. An audit that always finds
ten issues is not an audit.
