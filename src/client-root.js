/**
 * dsh-completo — the single browser bundle.
 *
 * The host serves ONE bundle per package (`exports["./client"]`) and calls its
 * one `apply(ctx)`. Completo contributes three independent things to the
 * renderer, so this file owns that apply and dispatches:
 *
 *   - theme half     -> registers "Completo Studio" light and dark (`theme`)
 *   - page half      -> the "Completo" page in Settings -> Plugins (`slots`,
 *                       `locale`)
 *   - providers half -> the "Providers & API keys" guidance card inside that page,
 *                       plus a footer card on the Models page. Guidance only: the
 *                       harness owns providers and their secrets, so this half
 *                       touches no credential store.
 *
 * Each half stays inert when its services are absent, so a host without a
 * renderer still loads the bundle.
 *
 * build.mjs inlines the halves and the palette/summary literals into this
 * wrapper: a module-loader bundle cannot carry imports, and it may only require
 * react and react/jsx-runtime.
 */
window.__ModuleLoader__.load({
  id: "dsh-completo",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");
    var jsxRuntime = require("react/jsx-runtime");

    // Browser globals inside a module factory may be shadowed by the loader
    // wrapper, so reach them through the real global scope object.
    var Evaluator = globalThis.Function;
    var GLOBAL = globalThis;

    /** The palette module; build.mjs makes this a single-quoted string literal. */
    var palette = new Evaluator("return " + __COMPLETO_PALETTE__)();
    /** The shipped summary: what the bundle added, plus its version. */
    var summary = JSON.parse(__COMPLETO_SUMMARY__);

__NODE_COMPLETO_THEME_PART__

__NODE_COMPLETO_PAGE_PART__

__NODE_COMPLETO_PROVIDERS_PART__

    var name = "completo";
    // Every service a half needs is declared here, so apply() never probes and
    // the loader holds the bundle until this composition has them all.
    var inject = ["theme", "slots", "locale"];

    function apply(ctx) {
      var doc = GLOBAL.document === undefined ? undefined : GLOBAL.document;
      var providers = applyProviders(ctx, React, jsxRuntime.jsx, summary);
      registerThemes(ctx, palette);
      applyPage(ctx, doc, React, jsxRuntime.jsx, summary, providers.providers);
    }

    exports.name = name;
    exports.inject = inject;
    exports.apply = apply;
    exports.default = { name: name, inject: inject, apply: apply };
    return exports;
  }
});
