---
name: debug-loop
description: Diagnose a failing app change from evidence instead of guesses — reproduce, read the real error, bisect to the smallest cause, fix once, and prove it with the same reproduction.
---

# Debug loop

A bug report ("it's broken", "the button does nothing") is a starting point, not
a diagnosis. This loop turns it into a fix without the guess-and-rebuild spiral
that eats vibe-coding sessions.

## The loop

1. **Reproduce.** Get a deterministic recipe: URL, inputs, and the first step
   that differs from the expected behavior. If you cannot reproduce it, say what
   you tried and ask for the missing detail (the exact click, the console text,
   the request payload). Do not "fix" an unreproduced bug.
2. **Read the error, literally.** The console message, the stack frame, the HTTP
   status, the response body. Read the top frame's file and line before forming
   a theory. Most wrong fixes start with skipping this step.
3. **Bisect.** Shrink the failure: comment out the new code, hard-code a
   constant, call the same function from the console, or check
   `git diff` since the last working checkpoint. The smallest still-failing case
   names the cause; everything else is noise.
4. **State one hypothesis** that predicts an observation. "The fetch returns 200
   but with `items: null`, so the map throws" is testable; "something is wrong
   with state" is not.
5. **Fix the cause, not the symptom.** No `try/catch` that swallows the error,
   no extra `?? []` on a payload that should be validated, no timeout bump to
   hide a race. If a guard is the right fix, make it explicit and explain why.
6. **Prove it.** Re-run the exact reproduction from step 1 and the project's
   check command (`tsc --noEmit`, the test, the build). Report both results.

## Where to look first, by symptom class

| Symptom | Look at |
| --- | --- |
| Blank page / nothing renders | Console error, import cycles, a thrown error in a hook |
| Button does nothing | Event handler wiring, `disabled` logic, an intercepted click, a form's default submit |
| Stale data after an action | State update path, cache keys, missing refetch, `useEffect` dependency |
| Works locally, breaks in build | Env vars not defined, case-sensitive imports, `process` usage in the client |
| Works in one browser only | CSS feature support, `corner-shape`/`color-mix` fallbacks, pointer events |
| Random failure | Races: parallel effects ordering, unawaited promises, dev-server HMR stale state |

## Guardrails

- One change per iteration. Two simultaneous changes make the next observation
  uninterpretable.
- Keep the reproduction as a comment or a failing test if the project has a test
  runner; it is the only artifact that stops the bug from returning.
- If three iterations fail, stop and re-read the code with a wider view: read
  the whole file the error is in, not just the line. Escalate to the user with
  the evidence gathered rather than continuing to poke.
