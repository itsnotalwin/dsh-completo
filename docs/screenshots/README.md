# Screenshots

`completo-page.png` is the README image. It is **not** a hand-made mock and not a
screenshot of a live Harness window: it is a headless-Chrome screenshot of
`completo-page.html`, which is generated from the shipped bundle.

## How it is produced

```sh
# 1. rebuild, so dist/ matches src/
npm run build

# 2. render the page to HTML from dist/completo-client.js
node scripts/render-page.mjs

# 3. screenshot that HTML with a real browser (Chromium or Chrome)
chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1.5 --window-size=840,2450 \
  --screenshot=docs/screenshots/completo-page.png \
  "file:///<absolute path to this repository>/docs/screenshots/completo-page.html"
```

`scripts/render-page.mjs` loads the built bundle with stub client services,
captures the two components the bundle registers (`settings.plugins.tab` and
`settings.models.footer`), and serialises their React trees to HTML with a small
jsx-to-HTML walker. Class names, copy and structure come from the bundle; the
only added CSS is the chrome around it (the harness's shipped light-theme
`--dsw-alias-*` values), so the screenshot is labelled as such.

## What this proves, and what it does not

- **Proves:** the page component renders real copy, uses the bundle's own
  stylesheet, and lays out as the checked-in image shows. Regenerating it after a
  code change is how a visual regression like "the stylesheet never reached the
  DOM" or "the tag runs into the name" gets caught.
- **Does not prove:** how the page looks inside a running Harness window (live
  theme tokens, real fonts, sidebar width, scroll position), or that the theme's
  colours are the ones you see. That still needs a person looking at the app.

If you change the page, regenerate both files in the same commit so the image
cannot drift from the code.
