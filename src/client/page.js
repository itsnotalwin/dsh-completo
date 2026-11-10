/**
 * The "Completo" page for Settings -> Plugins.
 *
 * Inlined into the browser bundle by build.mjs, so it imports nothing: the
 * bundle supplies React, jsx and the shipped summary.
 */
function pageDefinition(React, jsx, summary, providers) {
  var Fragment = React.Fragment;
  var NS = "completo.discovery";
  // The shared dictionary: the page owns it, providers.js merges into it.
  var en = pageDefinition.en;

  var CSS_TAG = "dsh-completo/CompletoPage.css";
  var CSS = [
    ".cpt-wrap{display:flex;flex-direction:column;gap:16px;max-width:760px;color:var(--dsw-alias-label-primary)}",
    ".cpt-title{margin:0;font-size:16px;font-weight:500;line-height:24px}",
    ".cpt-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}",
    ".cpt-group{display:flex;flex-direction:column;gap:8px}",
    ".cpt-heading{margin:6px 0 0;font-size:13px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-secondary)}",
    ".cpt-card{border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));border-radius:var(--dsw-radius-xl);padding:12px 14px;display:flex;flex-direction:column;gap:6px}",
    ".cpt-row{display:flex;align-items:baseline;gap:10px;min-width:0}",
    ".cpt-line{display:flex;align-items:baseline;flex-wrap:wrap;gap:0 8px;min-width:0}",
    ".cpt-line .cpt-name{font-family:var(--dsw-font-family-code);font-size:12px}",
    ".cpt-describe{flex:1 1 auto;min-width:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}",
    ".cpt-row .cpt-tag{margin-left:auto}",
    ".cpt-name{font-size:14px;font-weight:500;line-height:22px;flex:none}",
    ".cpt-tag{flex:none;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xs);padding:0 6px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}",
    ".cpt-focused{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
    ".cpt-desc{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}",
    ".cpt-needs{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);opacity:.8}",
    ".cpt-code{font-family:var(--dsw-font-family-code)}",
    ".cpt-steps{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:2px}",
    ".cpt-input{flex:1 1 auto;min-width:0;height:28px;padding:0 8px;font-size:12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1,transparent);color:var(--dsw-alias-label-primary)}",
    ".cpt-button{flex:none;height:28px;padding:0 10px;font-size:12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}",
    ".cpt-button:disabled{opacity:.55;cursor:default}",
    ".cpt-button-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
    ".cpt-foot{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);opacity:.85}",
  ].join("");

  function ensureStyles(doc) {
    if (doc === undefined) return;
    var selector = "style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]";
    if (doc.querySelector(selector) !== null) return;
    var tag = doc.createElement("style");
    tag.setAttribute("data-plugin", "dsh-completo");
    tag.setAttribute("data-plugin-css", CSS_TAG);
    tag.textContent = CSS;
    doc.head.appendChild(tag);
  }

  function SkillLine(props) {
    var skill = props.skill;
    return jsx(
      "div",
      { className: "cpt-line" },
      jsx("span", { className: "cpt-name" }, skill.id),
      jsx("span", { className: "cpt-describe" }, ` ${skill.summary}`),
    );
  }

  function McpCard(props) {
    var server = props.server;
    var t = props.t;
    return jsx(
      "div",
      { className: "cpt-card" },
      jsx(
        "div",
        { className: "cpt-row" },
        jsx("span", { className: "cpt-name" }, server.title),
        jsx(
          "span",
          { className: "cpt-tag" + (server.enabledByDefault ? " cpt-focused" : "") },
          server.enabledByDefault ? t("enabled") : t("disabled"),
        ),
      ),
      jsx("p", { className: "cpt-desc" }, server.what),
      jsx("p", { className: "cpt-needs" }, server.needs ? t("needsLabel") + ": " + server.needs : ""),
    );
  }

  function ThemeCard(props) {
    var t = props.t;
    return jsx(
      "div",
      { className: "cpt-card" },
      jsx(
        "div",
        { className: "cpt-row" },
        jsx("span", { className: "cpt-name" }, t("themeName")),
        jsx("span", { className: "cpt-tag cpt-focused" }, t("enabled")),
      ),
      jsx("p", { className: "cpt-desc" }, t("themeDesc")),
    );
  }

  function CompletoPage(props) {
    var t = props.t;
    return jsx(
      Fragment,
      null,
      jsx(
        "div",
        { className: "cpt-wrap" },
        jsx("h2", { className: "cpt-title" }, t("title")),
        jsx("p", { className: "cpt-intro" }, summary.tagline),
        jsx(
          "section",
          { className: "cpt-group" },
          jsx("h3", { className: "cpt-heading" }, t("themeHeading")),
          jsx(ThemeCard, { t: t }),
        ),
        jsx(
          "section",
          { className: "cpt-group" },
          jsx("h3", { className: "cpt-heading" }, t("skillsHeading") + " (" + summary.skills.length + ")"),
          jsx("p", { className: "cpt-desc" }, t("skillsDesc")),
          jsx(
            "div",
            { className: "cpt-card" },
            summary.skills.map(function (skill) {
              return jsx(SkillLine, { key: skill.id, skill: skill });
            }),
          ),
        ),
        jsx(
          "section",
          { className: "cpt-group" },
          jsx("h3", { className: "cpt-heading" }, t("mcpHeading")),
          jsx("p", { className: "cpt-desc" }, t("mcpOff")),
          summary.mcp.map(function (server) {
            return jsx(McpCard, { key: server.server, server: server, t: t });
          }),
        ),
        providers === undefined ? null : jsx(providers, null),
        jsx("p", { className: "cpt-foot" }, t("remove")),
        jsx("p", { className: "cpt-foot" }, t("version", { version: summary.version })),
      ),
    );
  }

  return { NS: NS, dictionary: en, component: CompletoPage, ensureStyles: ensureStyles };
}

/**
 * Add the page to Settings -> Plugins as its own TAB.
 *
 * `settings.plugins.tab` is the section's tab list (the shipped inventory claims
 * id "all"); each entry renders as a page, so the component receives `t` from the
 * kit and needs nothing else. Registering into `plugins.item` instead would make
 * this a plugin *configuration* card, which expects a host-served config form.
 */
function applyPage(ctx, doc, React, jsx, summary, providers) {
  var page = pageDefinition(React, jsx, summary, providers);
  page.ensureStyles(doc);
  // Register the dictionary BEFORE binding a translator to it: the harness
  // locale service caches one bound translator per (face, namespace, revision),
  // so a `t` bound first would keep resolving against an empty namespace.
  ctx.effect(function () {
    return ctx.locale.register(page.NS, { en: page.dictionary });
  }, "completo-discovery: dictionary");
  var t = ctx.locale.bind(page.NS);
  ctx.effect(function () {
    return ctx.slots.register(
      { name: "settings.plugins.tab", id: "completo", order: 60, label: function () { return t("title"); }, locale: page.NS },
      page.component,
    );
  }, "completo-discovery: settings tab");
}

function pageStrings() {
  return Object.assign({}, pageDefinition.en);
}

/**
 * Every English string of this namespace, in one object. providers.js merges its
 * own keys into this exact object, so the single locale registration in
 * applyPage() serves both halves.
 */
pageDefinition.en = {
  title: "Completo",
  themeHeading: "Theme",
  themeName: "Completo Studio",
  themeDesc:
    "Warm paper and mint, light and dark. Registered with the harness theme service - pick it under Appearance; it does not switch on by itself.",
  skillsHeading: "Skills",
  skillsDesc:
    "Ask for the outcome in plain words and the agent loads the matching skill. You can also name one.",
  mcpHeading: "MCP servers",
  mcpOff: "Only the browser server is on. A disabled server costs nothing until you switch it on.",
  enabled: "on",
  disabled: "off",
  needsLabel: "needs",
  remove: "Remove it with: dsh plugin --profile <name> remove dsh-completo",
  version: "Completo {version} - community bundle, not affiliated with DeepSeek.",
};