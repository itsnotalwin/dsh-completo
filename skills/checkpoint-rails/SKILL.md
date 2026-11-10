---
name: checkpoint-rails
description: Keep every working state of a prompt-built app recoverable — commit at slice boundaries, tag the states worth returning to, and never leave an experiment straddling a good commit.
---

# Checkpoint rails

Vibe coding moves fast; the safety net has to move faster. This is about git
hygiene that takes seconds and pays for itself the first time a refactor goes
sideways. It is a discipline, not a feature: no undo plugin or session rewind is
required.

## The two rails

- **Rails are checkpoints.** A commit is a state you can return to with a single
  command. Tag the good ones. Never let a prompt session end with uncommitted
  work that matters.
- **Rails are narrow.** One slice per commit. If a commit message needs "and",
  it is two commits — or one experiment that should not be on the working branch.

## Cadence

Commit when, not every few minutes:

1. A vertical slice works end to end (the `spec-flow` definition of done).
2. A risky change turned out fine — right before the next risky change.
3. You are about to let the model try something speculative.

Before any speculative prompt (big refactor, dependency swap, design rewrite):

```bash
git status                 # nothing unexpected is staged
git add -A
git commit -m "checkpoint: <what works right now>"
git tag -f cp-<slice>-<n>  # cheap named state to return to
```

After the experiment:

```bash
git diff cp-<slice>-<n>          # what actually changed
git restore --source cp-<slice>-<n> -- .   # take it all back, keep untracked output
```

`git tag -f` moves the tag; that is fine for local rails. Push tags only when the
user asks.

## Repository setup (once per project)

- `.gitignore` before the first commit: `node_modules/`, `dist/`, `.env*`,
  `.DS_Store`, `*.log`, and the dev-server cache. Verify with
  `git status --short` that no build output is staged.
- Never commit `.env` files. Commit a `.env.example` with the key names and no
  values.
- If the project is not a repository yet, `git init` and make the first commit
  *before* generating code, so every later state has a parent.
- Do not commit generated lockfile churn and source changes in the same commit
  when a dependency change is deliberate; keep dependency commits separate so a
  `git revert` is meaningful.

## Commit messages that help the next prompt

```text
feat(gap): rank skills from pasted description
checkpoint: history list renders and survives reload
exp: switch chart lib to visx (evaluate, maybe revert)
fix(api): validate model JSON before render
```

The type prefix and the surface in parentheses let you and the model find "the
commit where history worked" months later. "update files" does not.

## Hard rules

- Never `git push --force`, never rewrite pushed history, never delete a branch
  with unmerged work — unless the user explicitly asks for that exact command.
- Never commit secrets, tokens, or `.env` content; if one slips in, say so
  immediately and treat the credential as leaked.
- Leave the tree clean at the end of a work session: either committed, or the
  user told in one line what is uncommitted and why.
