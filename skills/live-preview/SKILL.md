---
name: live-preview
description: See the running app the way a user does — drive it with the Playwright MCP browser, read console and network errors, turn a screenshot into the next fix.
---

# Live preview

The fastest loop in vibe coding is: change → look → fix. This skill is that loop
done deliberately, with evidence instead of imagination.

## Prerequisite

An MCP server named `completo-mcp-playwright` must be enabled in this profile,
which exposes tools under `mcp__completo-mcp-playwright__*`. Check with the tool
list before promising a preview. If it is missing, say so in one line and fall
back to `curl` + the build from `react-vite-base` — do not fake a "look".
The other browser rows in the Completo pack are disabled by default: enable
`completo-mcp-chrome-devtools` for deep performance/network traces.

If the app is not running, start the dev server as a background job and wait for
the first successful HTTP response before opening the browser.

## The loop

1. **Frame it.** Decide the one flow to check ("paste a job description → ranked
   list appears"). Previewing everything at once produces screenshots nobody
   reads.
2. **Open.** Navigate to the exact URL of the flow's entry page. Set a viewport
   that matches the user's world: 1280×800 for desktop web, 390×844 for a
   mobile-first change.
3. **Act.** Perform the flow with real interactions (type, click, wait for the
   network to settle). Never assert on markup you did not just observe.
4. **Collect evidence.** Take a screenshot *and* read the console and failed
   requests. A visually perfect page with three 404s is not done.
5. **Read it like a reviewer.** Compare against the change you intended: what
   moved, what is missing, what is clipped, what overflows, what looks
   disabled-but-isn't.
6. **Fix, then re-shoot.** One fix at a time, then screenshot again. Stop when
   the screenshot matches the intent and the console is clean.

## What to check every time

- Empty state, loading state, and error state of the surface you touched — the
  three states that never appear in the happy-path screenshot.
- Text at the smallest viewport in use: nothing clipped, nothing overlapping,
  no horizontal scrollbar on the page body.
- Focus order and hit targets for anything interactive; disabled buttons must
  look disabled.
- Contrast of new text against its own background, not against white.

## Reporting to the user

Attach the screenshot rather than describing it, and state the URL, viewport,
and what you clicked. When something is wrong, name the element and the fix you
propose in the same message. "Here is the page; the ranked list overflows on
mobile — I'll cap it at 40vh and re-shoot" is the whole report.

## When a preview is impossible

No Playwright row, no network, or a headless-only environment: say exactly which
check you could not run and what you did instead. Never claim a visual change
was verified when it was not.
