/**
 * dsh-completo — render the browser bundle against stubs of the client services.
 *
 * Run by `npm run check`. The harness renderer calls each client bundle's
 * `apply(ctx)` with real services; this does the same with recording stubs, so a
 * generated bundle that parses but registers the wrong thing fails here instead
 * of in someone's browser. No DOM, no network, no harness.
 *
 * Exits non-zero, with the reason on stderr, when the bundle misbehaves.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];
const ok = (condition, message) => {
  if (!condition) fails.push(message);
};

// --- the loader contract --------------------------------------------------
const requested = [];
const loaded = [];
const heads = [];

const FRAGMENT = Symbol("Fragment");
const jsx = (type, props, ...children) => ({ type, props: children.length === 0 ? (props ?? {}) : { ...(props ?? {}), children } });

function requireFor(id) {
  requested.push(id);
  // Count what the bundle requires: a helper the build forgot to inline shows up
  // here as the requested id being the helper's own name.
  if (id !== "react" && id !== "react/jsx-runtime") throw new Error(`bundle required "${id}", which the harness loader does not provide`);
  if (id === "react") return { Fragment: FRAGMENT, createElement: (type, props) => ({ type, props: props ?? {} }) };
  return { jsx, jsxs: jsx, Fragment: FRAGMENT };
}

function datasetKey(attribute) {
  return attribute.replace(/^data-/u, "").replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}

/** A <style> stand-in that behaves like a DOM node: `dataset` AND setAttribute. */
function styleElement() {
  const node = { dataset: {}, textContent: "" };
  node.setAttribute = (name, value) => {
    node.dataset[datasetKey(name)] = String(value);
  };
  node.getAttribute = (name) => node.dataset[datasetKey(name)] ?? null;
  return node;
}

globalThis.document = {
  head: { appendChild: (node) => heads.push(node) },
  querySelector: () => null,
  createElement: () => styleElement(),
};
globalThis.window = {
  __ModuleLoader__: {
    load: (definition) => loaded.push({ id: definition.id, factory: definition.factory }),
  },
};

// The host serves ONE bundle per package: exports["./client"], and it calls the
// bundle's single apply. Completo's three halves are dispatched from inside it.
const BUNDLE = "dist/completo-client.js";
try {
  new Function(readFileSync(join(ROOT, BUNDLE), "utf8"))(); // eslint-disable-line no-new-func
} catch (error) {
  fails.push(`${BUNDLE} threw while loading: ${error.message}`);
}
const declared = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
ok(declared.exports?.["./client"] === "./" + BUNDLE, 'package.json exports["./client"] does not point at the bundle');

// --- recording stubs of the client services the halves inject -------------
/** Expand a jsx tree the way React would, returning its serialized text. */
function render(node, depth) {
  if (node === null || node === undefined || depth > 40) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => render(child, depth + 1)).join(" ");
  if (typeof node !== "object") return "";
  if (typeof node.type === "function") return render(node.type(node.props ?? {}), depth + 1);
  return render(node.props?.children, depth + 1);
}

const themes = [];
const slots = [];
const locales = [];
const effects = [];
const credentialCalls = [];
const dictionaries = new Map();
const misses = new Set();

// The only service the providers half talks to. Every call answers the way the
// harness Remote does: `{ok: true, value}` or `{ok: false, error: {message}}`.
const credentials = {
  describe: (refs) => {
    credentialCalls.push({ kind: "describe", refs });
    const value = Object.fromEntries(refs.map((ref) => [ref, { configured: ref === "GITHUB_TOKEN", source: "file", writable: true }]));
    return Promise.resolve({ ok: true, value });
  },
  set: (ref, value) => {
    credentialCalls.push({ kind: "set", ref, value });
    return Promise.resolve({ ok: true, value: { configured: true } });
  },
  unset: (ref) => {
    credentialCalls.push({ kind: "unset", ref });
    return Promise.resolve({ ok: true, value: { configured: false } });
  },
};

for (const definition of loaded) {
  // The factory must run with the stubs installed, as it does in a browser.
  const exported = definition.factory(requireFor);
  const label = `${exported.name ?? definition.id}`;
  ok(exported.name === "completo", `${definition.id} exports name "${exported.name}", expected "completo"`);
  ok(Array.isArray(exported.inject), `${label} exports no inject list`);
  ok(
    ["theme", "slots", "locale", "remote", "remote.credentials"].every((service) => exported.inject?.includes(service)),
    `${label} must inject theme, slots, locale and the credentials Remote (got ${JSON.stringify(exported.inject)})`,
  );
  const ctx = {
    effect: (run, description) => {
      effects.push(description);
      const dispose = run();
      return typeof dispose === "function" ? dispose : () => {};
    },
    remote: { credentials },
    theme: {
      register: (theme) => {
        themes.push(theme);
        return () => {};
      },
    },
    slots: {
      inject: (name, run) => {
        effects.push(`inject:${name}`);
        return run();
      },
      register: (options, component) => {
        // A Settings page maps slot entries to TABS, so `label` must resolve to a
        // string. It is left unresolved here on purpose: the gate asserts that.
        slots.push({ ...options, component });
        return () => {};
      },
    },
    locale: {
      // Resolve like the harness: a registered string wins, anything else falls
      // back to the key. A miss is recorded so a half that forgot to register its
      // strings cannot pass by merely asking for them.
      bind: (namespace) => (key, values) => {
        const table = dictionaries.get(namespace)?.en ?? {};
        if (typeof table[key] !== "string") {
          misses.add(`${namespace}:${key}`);
          return `${namespace}:${key}`;
        }
        return values?.version ? `${table[key]}:${values.version}` : table[key];
      },
      register: (namespace, books) => {
        // The bundle serves one shape: `{ en: { ...strings } }`. Anything else is
        // a real bug in the half that produced it, so say so instead of guessing.
        const english = books?.en;
        if (english === null || typeof english !== "object") {
          fails.push(`locale.register("${namespace}") passed no English book (got ${JSON.stringify(Object.keys(books ?? {}))})`);
        }
        dictionaries.set(namespace, { en: { ...(english ?? {}) } });
        locales.push({ namespace, languages: Object.keys(books ?? {}), keys: Object.keys(english ?? {}).length });
        return () => {};
      },
    },
  };
  try {
    exported.apply(ctx);
  } catch (error) {
    fails.push(`${label}.apply() threw: ${error.message}`);
  }

  // The page registers as a Settings -> Plugins TAB (the shipped inventory claims
  // id "all"), so the component gets `t` from the slot kit and nothing else.
  const page = slots.find((slot) => slot.name === "settings.plugins.tab");
  if (typeof page?.component === "function") {
    try {
      const tree = page.component({ t: ctx.locale.bind(page.locale), renderSlot: () => null });
      const rendered = render(tree, 0);
      ok(rendered.length > 1200, `the page component rendered almost nothing (${rendered.length} chars)`);
      const expected = [
        // the pack
        "spec-flow",
        "ship-audit",
        "Playwright browser",
        "Completo",
        // the providers & keys surface, asserted as resolved copy - a raw key here
        // means a half forgot to put its strings in the one registered dictionary
        "Providers & API keys",
        "Keys the MCP servers here read",
        "Custom model API",
        "GITHUB_TOKEN",
        "CONTEXT7_API_KEY",
        "DATABASE_URL",
      ];
      for (const needle of expected) ok(rendered.includes(needle), `the page never renders "${needle}"`);
    } catch (error) {
      fails.push(`the page component threw while rendering: ${error.message}`);
    }
  }

  const footer = slots.find((slot) => slot.name === "settings.models.footer");
  ok(footer !== undefined, "the providers half did not register a settings.models.footer card");
  if (typeof footer?.component === "function") {
    try {
      const rendered = render(footer.component({ t: ctx.locale.bind(footer.locale) }), 0);
      ok(rendered.length > 40, `the Models footer card rendered almost nothing (${rendered.length} chars)`);
    } catch (error) {
      fails.push(`the Models footer card threw while rendering: ${error.message}`);
    }
  }
}

// --- what the bundle must have registered ---------------------------------
ok(loaded.length === 1, `expected 1 browser bundle, loaded ${loaded.length}`);
ok(
  requested.every((id) => id === "react" || id === "react/jsx-runtime"),
  `a browser half required something other than react: ${requested.join(", ")}`,
);

ok(themes.length === 2, `theme half registered ${themes.length} themes, expected 2 (light and dark)`);
ok(
  themes.every((theme) => theme.id === "completo-studio-light" || theme.id === "completo-studio-dark"),
  `unexpected theme ids: ${themes.map((theme) => theme.id).join(", ")}`,
);
ok(
  themes.every((theme) => Object.keys(theme.tokens ?? {}).length === 14),
  "a registered theme does not carry all 14 tokens",
);
ok(
  themes.every((theme) => Object.keys(theme.tokens ?? {}).every((token) => token.startsWith("--dsw-"))),
  "a registered theme sets a token that is not a --dsw-* custom property",
);
ok(
  new Set(themes.map((theme) => theme.colorScheme)).size === 2,
  "the two themes do not cover both colour schemes",
);

const pageSlots = slots.filter((slot) => slot.name === "settings.plugins.tab");
ok(pageSlots.length === 1, `registered ${pageSlots.length} settings.plugins.tab slots, expected 1`);
ok(pageSlots[0]?.id === "completo", `settings.plugins.tab id is "${pageSlots[0]?.id}", expected "completo"`);
ok(typeof pageSlots[0]?.label === "function", "settings.plugins.tab label must be a callback, not a constant");
// The Settings shell resolves the tab caption through the row's own namespace, so
// run the callback against the registered dictionary the same way the shell does.
const resolveSlotLabel = (slot) => {
  if (typeof slot?.label === "string") return slot.label;
  if (typeof slot?.label !== "function") return undefined;
  const table = dictionaries.get(slot.locale ?? "completo.discovery")?.en ?? {};
  try {
    return slot.label((key) => table[key] ?? `${slot.locale}:${key}`);
  } catch (error) {
    fails.push(`settings.plugins.tab label() threw: ${error.message}`);
    return undefined;
  }
};
const pageLabel = resolveSlotLabel(pageSlots[0]);
ok(typeof pageLabel === "string" && pageLabel.length > 0, `settings.plugins.tab label resolved to ${JSON.stringify(pageLabel)}`);
ok(pageSlots[0]?.locale === "completo.discovery", "settings.plugins.tab does not declare its dictionary namespace");
ok(typeof pageSlots[0]?.component === "function", "settings.plugins.tab registered no component");
// The inventory owns id "all" at order 10; Completo must not collide with it.
ok(pageSlots[0]?.id !== "all", 'settings.plugins.tab id "all" is taken by the shipped inventory tab');
const bundleLocales = locales.filter((entry) => entry.namespace === "completo.discovery");
ok(bundleLocales.length === 1, `registered the completo.discovery dictionary ${bundleLocales.length} times, expected exactly 1`);
ok(
  bundleLocales.some((entry) => entry.languages.includes("en") && entry.keys >= 25),
  `the completo.discovery dictionary holds ${bundleLocales[0]?.keys ?? 0} strings, expected at least 25`,
);
ok(
  misses.size === 0,
  `a translated key resolved to nothing (unregistered string): ${[...misses].join(", ")}`,
);
ok(heads.length === 1, `expected exactly one injected stylesheet, got ${heads.length}`);
ok(
  heads.every((node) => node.dataset?.plugin === "dsh-completo" && typeof node.dataset?.pluginCss === "string"),
  "the injected stylesheet is missing its data-plugin / data-plugin-css tags",
);

// --- the key surface must be write-only -----------------------------------
ok(
  credentialCalls.some((call) => call.kind === "describe"),
  "the providers half never asked the credential store for its state",
);
ok(
  !JSON.stringify(credentialCalls).includes("probe-value"),
  "the providers half sent a secret somewhere unexpected",
);
const describeCall = credentialCalls.find((call) => call.kind === "describe");
ok(
  ["GITHUB_TOKEN", "CONTEXT7_API_KEY", "DATABASE_URL"].every((ref) => describeCall?.refs?.includes(ref)),
  `the credential state call does not name every ref Completo's MCP rows read (got ${JSON.stringify(describeCall?.refs)})`,
);

if (fails.length > 0) {
  for (const fail of fails) console.error(`  - ${fail}`);
  process.exit(1);
}
console.log(
  `browser bundle: ${themes.length} themes x ${Object.keys(themes[0].tokens).length} tokens, ` +
    `${pageSlots.length} settings page + ${slots.length - pageSlots.length} models footer ` +
    `(${locales[0]?.keys ?? 0} strings), ${heads.length} stylesheet, ${credentialCalls.length} key calls, react-only requires`,
);
