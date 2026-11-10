// Render the Completo plugin page to HTML so it can be screenshotted honestly.
//
//   node scripts/render-page.mjs      # writes docs/screenshots/completo-page.html
//
// It loads the SHIPPED browser bundle (dist/completo-client.js) with the same
// stub environment scripts/client.mjs uses, captures the two components the
// bundle registers (the Settings > Plugins tab and the Settings > Models footer
// card), and serialises their React element trees to HTML with a small
// jsx-to-HTML walker. Nothing is mocked at the markup level: class names, copy
// and structure all come from the bundle itself. The emitted file wraps that in
// the harness's shipped chrome palette (the page's own stylesheet is the real
// one), so a screenshot shows the page instead of a design mock - and it is
// checked in, so a screenshot cannot silently drift from the code.
//
// The PNG next to it is made by a browser, because this script deliberately
// does not fake one:
//
//   chrome --headless=new --disable-gpu --hide-scrollbars \
//     --force-device-scale-factor=1.5 --window-size=840,2450 \
//     --screenshot=docs/screenshots/completo-page.png \
//     "file:///<repo>/docs/screenshots/completo-page.html"
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const BUNDLE = join(ROOT, 'dist', 'completo-client.js')
const OUT = join(ROOT, 'docs', 'screenshots', 'completo-page.html')
const NL = String.fromCharCode(10)

const source = readFileSync(BUNDLE, 'utf8')

let loaded = null
globalThis.window = globalThis
globalThis.__ModuleLoader__ = {
  load(bundle) {
    loaded = bundle
  },
}
// node >= 21 exposes a read-only `navigator`; the page reads its userAgent to
// choose between PowerShell and POSIX shell hints.
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
})

const FRAGMENT = Symbol.for('react.fragment')
const React = { Fragment: FRAGMENT }
const jsx = (type, props, ...children) => ({
  type,
  props: children.length === 0 ? (props ?? {}) : { ...(props ?? {}), children: children.length === 1 ? children[0] : children },
})

const dictionaries = new Map()
const slots = []
const styles = []

const ctx = {
  effect(fn) {
    return fn()
  },
  // No remote/credentials stub on purpose: the bundle must not provide one.
  theme: {
    register() {
      return () => {}
    },
  },
  slots: {
    inject(_name, run) {
      return run()
    },
    register(options, component) {
      slots.push({ name: options.name, id: options.id, locale: options.locale, component })
      return () => {}
    },
  },
  locale: {
    bind(namespace) {
      const t = (key, params) => {
        if (typeof key !== 'string') return String(key)
        const table = dictionaries.get(namespace) ?? {}
        const value = table[key]
        if (typeof value !== 'string') return key
        if (params === undefined || params === null) return value
        return Object.entries(params).reduce((text, [name, raw]) => text.split('{' + name + '}').join(String(raw)), value)
      }
      return t
    },
    register(namespace, values) {
      dictionaries.set(namespace, { ...(values.en ?? {}) })
      return () => {}
    },
  },
}

function requireFor(name) {
  if (name === 'react') return React
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: FRAGMENT }
  throw new Error('render-page: the bundle required "' + name + '", which the harness does not provide')
}

function datasetKey(attribute) {
  return attribute.replace(/^data-/u, '').replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase())
}

const documentStub = {
  head: {
    appendChild(node) {
      styles.push(node)
    },
  },
  querySelector() {
    return null
  },
  createElement() {
    const node = { dataset: {}, textContent: '' }
    node.setAttribute = (name, value) => {
      node.dataset[datasetKey(name)] = String(value)
    }
    node.getAttribute = (name) => node.dataset[datasetKey(name)] ?? null
    return node
  },
}
globalThis.document = documentStub

const mod = { exports: {} }
new Function('window', 'require', 'module', 'exports', 'document', source).call(globalThis, globalThis, requireFor, mod, mod.exports, documentStub)
if (loaded === null) throw new Error('render-page: the bundle is not a module-loader bundle')
loaded.factory(requireFor).apply(ctx)

const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link'])
const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function attrsOf(props) {
  const out = []
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key === 'children' || value === null || value === undefined || value === false) continue
    if (key === 'className') out.push('class="' + escape(value) + '"')
    else if (key === 'htmlFor') out.push('for="' + escape(value) + '"')
    else if (key === 'style' && typeof value === 'object') {
      const css = Object.entries(value)
        .map(([name, raw]) => name.replace(/[A-Z]/gu, (letter) => '-' + letter.toLowerCase()) + ':' + raw)
        .join(';')
      out.push('style="' + escape(css) + '"')
    } else if (typeof value !== 'function') out.push(key + '="' + escape(value) + '"')
  }
  return out.length === 0 ? '' : ' ' + out.join(' ')
}

function toHtml(node) {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return escape(node)
  if (Array.isArray(node)) return node.map(toHtml).join('')
  if (node.type === FRAGMENT) return toHtml(node.props?.children)
  if (typeof node.type === 'function') return toHtml(node.type({ ...(node.props ?? {}) }))
  const tag = String(node.type)
  const attrs = attrsOf(node.props)
  if (VOID.has(tag)) return '<' + tag + attrs + '>'
  return '<' + tag + attrs + '>' + toHtml(node.props?.children) + '</' + tag + '>'
}

const page = slots.find((slot) => slot.name === 'settings.plugins.tab')
if (page === undefined) throw new Error('render-page: the bundle registered no settings.plugins.tab slot')
const footer = slots.find((slot) => slot.name === 'settings.models.footer')

const pageHtml = toHtml(page.component({ t: ctx.locale.bind(page.locale) }))
const footerHtml = footer === undefined ? '' : toHtml(footer.component({ t: ctx.locale.bind(footer.locale) }))
const css = styles.map((node) => String(node.textContent)).join(NL)
if (styles.length !== 1 || css.length < 500) throw new Error('render-page: expected exactly one injected stylesheet, got ' + styles.length)

// The harness paints --dsw-alias-* on <body> from the ACTIVE theme. These are the
// shipped light defaults, not Completo Studio, so the screenshot says so. The
// page's own stylesheet above is the bundle's real one.
const chrome = [
  ':root{',
  '--dsw-alias-bg-base:#ffffff;--dsw-alias-bg-layer-1:#ffffff;--dsw-alias-bg-layer-2:#f5f5f5;',
  '--dsw-alias-border-l1:#e8e8e8;--dsw-alias-border-l2:#dcdcdc;--dsw-alias-label-primary:#1a1a1a;',
  '--dsw-alias-label-secondary:#666666;--dsw-alias-brand-primary:#4d6bfe;',
  '--dsw-alias-settings-card-fill:#fafafa;--dsw-alias-settings-card-stroke:#ececec;',
  '--dsw-radius-xs:4px;--dsw-radius-sm:8px;--dsw-radius-xl:16px;',
  '--dsw-font-family-code:"SF Mono",Consolas,monospace;',
  '}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:#ffffff;color:#1a1a1a;font:14px/1.5 "Segoe UI",system-ui,sans-serif}',
  '.frame{padding:24px;max-width:900px}',
  '.bar{display:flex;gap:8px;align-items:center;margin-bottom:18px;font-size:12px;color:#666}',
  '.tab{border:1px solid #dcdcdc;border-radius:8px;padding:3px 10px}',
  '.tab.on{background:#f0f2ff;border-color:#4d6bfe;color:#4d6bfe}',
  '.note{margin:0 0 18px;font-size:12px;color:#888}',
].join('')

const html = [
  '<!doctype html>',
  '<html lang="en"><head><meta charset="utf-8">',
  '<title>Completo - plugin page (rendered from the shipped bundle)</title>',
  '<style>' + chrome + NL + css + '</style></head>',
  '<body><div class="frame">',
  '<div class="bar"><span>Settings</span><span>&rsaquo;</span><span>Plugins</span><span>&rsaquo;</span><span class="tab on">Completo</span></div>',
  '<p class="note">Rendered from dist/completo-client.js, the bundle this release ships. The page chrome colours here are DSH shipped light defaults; the page own stylesheet is the real one.</p>',
  pageHtml,
  '<p class="note" style="margin-top:28px">The same card at the bottom of Settings &rsaquo; Models:</p>',
  '<div class="cpt-card">' + footerHtml + '</div>',
  '</div></body></html>',
].join(NL) + NL

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, html, 'utf8')
console.log('wrote ' + OUT + ' (' + html.length + ' bytes, ' + pageHtml.length + ' page chars, ' + footerHtml.length + ' footer chars)')
