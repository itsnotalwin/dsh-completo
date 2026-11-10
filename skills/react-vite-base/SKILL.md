---
name: react-vite-base
description: Stand up or extend a React + Vite + TypeScript app that stays maintainable — reachable dev server, typed data layer, one folder per feature, one verify command.
---

# React + Vite base

A working baseline for a prompt-built web app. Use it to create the app, or as
the checklist when extending one that grew without structure.

## Create

Ask the user for the project directory if it does not exist yet, then:

```bash
npm create vite@latest <dir> -- --template react-ts
cd <dir>
npm install
npm run dev -- --port 5173 --strictPort
```

`--strictPort` matters: a dev server that silently moves to 5174 breaks every
preview step that assumes a URL. If the port is taken, say so and pick a
different fixed port rather than letting Vite decide.

Add nothing else by default. Add a dependency only when the slice needs it, and
say why in one line (`npm install zod` — "validate the model's JSON before
rendering"). Ask before adding anything with native code or a build plugin.

## Structure

```text
src/
  main.tsx           entry; providers only
  App.tsx            router + layout
  features/<name>/   one folder per surface: page, components, hooks, api
  lib/               fetch client, types shared across features, formatting
  styles/            tokens.css (CSS custom properties), global.css
```

Rules that keep prompt-built code readable to the next prompt:

- One feature folder per surface; a page never imports another feature's
  internals — shared things move to `lib/`.
- Types named after the domain and exported from the feature's `api.ts`, so a
  later prompt can say "reuse `GapRun` from `features/gap/api.ts`".
- No `any` in committed code. If an external payload is unknown, parse it at the
  boundary with a schema and keep `any` out of components.
- State stays local until two surfaces need it; then one small store in `lib/`.

## Data layer

- Browser-only prototypes: read/write `localStorage` through one module in
  `lib/`, never from components.
- Local backend: a single `lib/api.ts` with `fetch` wrappers, base URL from
  `import.meta.env.VITE_API_BASE ?? "/api"`.
- Secrets never in client code. `VITE_*` variables are compiled into the bundle
  and visible to everyone; server keys belong to a dev server or a backend.

## Verify without a browser

```bash
npx tsc --noEmit        # types
npm run build           # production build really compiles
curl -s localhost:5173 | head   # dev server answers
```

Only reach for the browser (see `live-preview`) when the change is visual or
interactive. A green `tsc --noEmit` plus a green `npm run build` catches most of
what a screenshot would.

## Extending an existing app

Read before writing: `package.json` (scripts, existing libraries),
`src/App.tsx` (routing), one neighbouring feature folder (the house style).
Match those three and the new code will look native; invent a new pattern and
the next prompt will fight it.
