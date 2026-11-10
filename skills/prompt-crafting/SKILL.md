---
name: prompt-crafting
description: Get a better result from the same model in one message — the structure of a high-signal build prompt, what to attach, and how to correct course without resetting the session.
---

# Prompt crafting

Most disappointing output is a prompt problem, not a model problem. A build
prompt carries six things; when one is missing the model invents it and you pay
for the invention in revisions.

## The six parts

1. **Target** — the surface and the file(s) that should change. "Add X to
   `src/pages/History.tsx`" beats "make the history page better".
2. **Behavior** — what happens, in the user's words, including the failure case.
   "If the list is empty show a hint with the paste box focused."
3. **Constraints** — stack, libraries already in `package.json`, style rules,
   what must NOT change. Point at the repo instead of retyping it: "follow the
   patterns in `src/features/gap/`".
4. **Done signal** — how you will both know it worked: a command, a URL, a
   screenshot, a test name.
5. **Scope fence** — explicitly out of scope for this turn. This single line
   removes most unrequested refactors.
6. **Context** — only what the model cannot infer: an API shape, a design token,
   a business rule. Paste the relevant 30 lines, not the whole file.

## Prompt shapes that work

- **Build**: target + behavior + constraints + done signal, one paragraph, then
  a short bullet list of acceptance checks.
- **Fix**: symptom, reproduction steps, the exact error text, and the last
  thing that changed. Do not describe the suspected cause — let the model
  verify it.
- **Refactor**: the invariant that must hold afterwards, the files allowed to
  change, and the command that proves it still works.
- **Style/UX**: two reference screenshots or a named app plus the delta you
  want. Adjectives alone ("modern", "clean") carry almost no information.

## Attaching versus describing

Attach when the model must match exact content: a schema, an error stack, a
design, a competitor layout. Describe when the content is reproducible from the
repo. Every attachment is context spent; prefer "read `src/lib/db.ts`" over
pasting it.

## Correcting course

- One correction message carries: what is wrong (concretely), what you expected,
  and whether the previous work should be kept or discarded. "Revert the chart
  and keep the table" is precise; "that's not what I wanted" is not.
- If two corrections in a row miss, the prompt is underspecified — stop and
  rewrite the target/behavior/done-signal together rather than nudging again.
- Keep a durable decision out of chat: when you agree on something the model
  keeps forgetting, put it in the repo (an `AGENTS.md` line, a comment, a type)
  so it survives session resets.

## Vibe-coding defaults worth stating once per project

State these in the first message of a project and they hold for the rest of it:
package manager, dev command and port, formatting/lint command, where components
live, how state is managed, and the rule "ask before adding a dependency".
