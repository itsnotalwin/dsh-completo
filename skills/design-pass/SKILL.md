---
name: design-pass
description: Take a working page and make it look intentional in one pass — spacing rhythm, hierarchy, real empty/loading/error states, palette through tokens.
---

# Design pass

The difference between "a prototype" and "an app" is usually one focused pass
over the same markup: rhythm, hierarchy, states, and restraint. Do this after the
slice works, and do it as a single pass rather than sprinkling polish into every
later prompt.

## Order of operations

Fix these in order; each one makes the next cheaper.

1. **Spacing rhythm.** Pick a scale and use only it: 4 · 8 · 12 · 16 · 24 · 32 ·
   48. Replace arbitrary paddings (`padding: 13px 27px`) with scale steps. Most
   "it looks off" complaints are inconsistent vertical rhythm.
2. **Hierarchy.** Each screen gets exactly one primary action. Sizes encode
   importance: page title, section title, body, supporting text. If two elements
   compete at the same weight, one of them is wrong.
3. **States.** Empty, loading, error, and success for every surface that fetches
   or writes. An empty state says what to do next; a loading state reserves the
   final layout's height so nothing jumps; an error state says what failed and
   offers a retry.
4. **Palette through tokens.** One CSS custom property per role (surface,
   surface-raised, border, text, text-muted, accent) in `styles/tokens.css`; the
   rest of the app references the tokens. No literal hex outside that file. This
   is what makes a dark mode and a re-theme possible later in minutes.
5. **Type.** Two weights are usually enough (400 for body, 500–600 for headings).
   Body line-height 1.5–1.6; heading line-height 1.2–1.3. Keep the measure
   between 45 and 75 characters for reading text.
6. **Motion.** One duration token (120–200 ms) and one easing for all
   transitions, and honour `prefers-reduced-motion` by dropping transforms and
   keeping state changes instant.

## The five-minute review

Look at a screenshot of the page (see `live-preview`) and ask, in this order:

- What is the first thing my eye lands on? Is that the primary action?
- Squint: does the layout have a clear grid, or do edges drift?
- Where does the eye stop? Long unbroken blocks need grouping or a divider.
- Any element that is a different shade of "almost the same" gray? Consolidate
  to a token.
- Does anything look like a placeholder — lorem, "TODO", sample names,
  unstyled buttons, a heading with no content under it?

## Restraint

- Default to no shadow, one border, one accent. Add decoration only where it
  carries meaning.
- Never ship more than three font sizes visible at once on one screen.
- Hover and focus states on every interactive element; focus must be visible
  with the keyboard.
- Contrast: body text at least 4.5:1 against its own background, large text at
  least 3:1. Check against the elevation the text actually sits on.
- Do not restyle the host application or another app's design system; this
  skill is for the app you are building.

## Done

A design pass is done when a screenshot of the primary flow needs no caption to
explain what the app does. Stop there — keeping the pass short is what makes it
repeatable later when the app grows.
