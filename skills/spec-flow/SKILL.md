---
name: spec-flow
description: Turn a one-line app idea into a build-ready spec in five minutes — pages, data, the two risky unknowns, and the first vertical slice. Load before writing code for a new app or a large feature.
---

# Spec flow

Vibe coding fails in one specific way: you start building before you know what
"done" means, then spend the afternoon re-deciding. This skill front-loads the
decisions that are expensive to change later and defers everything else.

Keep the whole thing under five minutes. The spec is a conversation aid, not a
deliverable.

## Rules

- Ask at most three questions before proposing a spec. If the user already gave
  enough detail, ask none and show the spec for correction instead.
- Never ask the user to decide something you can default sensibly. Propose the
  default in the spec and mark it `(assumed)`.
- One vertical slice first: the thinnest path through the app that a human can
  click end to end. Everything else is a later slice.

## The five fields

Write these down in the workspace (a short `SPEC.md` next to the code unless the
project already keeps specs somewhere) before the first file of app code:

1. **Job** — one sentence: "A user can ___ without ___." If it needs two
   sentences, split the project.
2. **Surfaces** — the pages/routes, one line each, with the main action per
   page. Cap the first slice at three.
3. **Data** — the entities and their fields, plus where data lives (local file,
   SQLite, hosted API, or in-memory for the first slice). Name the durable
   choice explicitly.
4. **Risky unknowns** — the two things most likely to break: an external API
   with auth, a platform capability, a performance ceiling, a payment flow.
   For each, name the cheapest way to find out early.
5. **Definition of done for the slice** — a checklist an outsider could run
   without asking you anything.

## Output shape

```text
JOB      A visitor can paste a job description and get a ranked skills gap list.
SURFACES / (paste box + result) · /history (list, view)
DATA     gap runs: id, createdAt, input text, items[{skill, level, why}] — SQLite
RISK     1. model output shape drifts → validate with a parser before rendering
         2. local dev server port clashes → make the port configurable now
DONE     paste sample → ranked list renders → survives reload → /history shows it
```

Then stop and ask: "Build this slice, or change the spec first?" Do not start
scaffolding in the same message as the spec.

## Anti-patterns

- A spec longer than the first slice will take to build.
- Listing every future feature (the user will name them as they go).
- Leaving "auth" or "deployment" implicit — if the slice touches them, make
  them explicit or explicitly out of scope.
- Deciding UI libraries and folder structure before the slice exists. Those
  are cheap to change; the data model and the risky unknowns are not.
