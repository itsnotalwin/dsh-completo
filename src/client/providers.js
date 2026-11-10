/**
 * Completo: the "Providers & API keys" guidance card.
 *
 * The harness already owns model providers AND their secrets (Settings ->
 * Models -> Add model provider), so this half deliberately builds no key store
 * of its own. It does one job: say where a provider is added, and state honestly
 * how the optional MCP servers get the values they read.
 *
 * Why no input boxes: an MCP server is a child process. The harness strips every
 * ambient KEY/PASSWORD/SECRET/TOKEN variable before spawning it and passes only
 * the row's own `env:` block, and a secret stored in the credential store never
 * reaches process.env. So a box on this page could accept a key and still never
 * configure a server - it would only look like it worked. The env names are
 * documented instead.
 */
function providersDefinition(React, jsx, summary) {
  var NS = "completo.discovery";
  // One dictionary per namespace: pageDefinition.en is the single object the page
  // serves, so every key below lands in it before apply() registers the locale.
  // Copying here would register a second, smaller table and leave these strings
  // unresolved.
  var en = pageDefinition.en;
  if (en === undefined || en === null || typeof en !== "object") {
    throw new Error("completo-providers: pageDefinition.en is missing; the page module must load first");
  }

  // The machine the MCP child processes actually inherit. This is the honest
  // answer to "where does a server's key have to be", so it is stated per
  // platform.
  var isWindows = typeof navigator === "object" && navigator !== null && /Windows/i.test(String(navigator.userAgent ?? ""));
  var shellPrefix = isWindows ? "$env:" : "";

  // Exactly the environment variables cordis.patch.yml reads, in the order the
  // MCP section lists the servers.
  var ENV_NAMES = [
    {
      name: "CONTEXT7_API_KEY",
      rows: "completo-mcp-context7",
      why: "Optional. Raises the documentation lookup limits; that server works without it.",
    },
    {
      name: "GITHUB_TOKEN",
      rows: "completo-mcp-github",
      why: "A personal access token with repository read. That server runs from the Docker image ghcr.io/github/github-mcp-server.",
    },
    {
      name: "DATABASE_URL",
      rows: "completo-mcp-postgres",
      why: "A read-only connection string for a scratch database. Never point it at production.",
    },
  ];

  Object.assign(en, {
    providersHeading: "Providers & API keys",
    providersDesc:
      "Model providers and their API keys belong to the harness, not to Completo. Add or change one under Settings -> Models -> Add model provider -> Custom model API: pick the protocol (OpenAI Chat Completions, OpenAI Responses or Anthropic Messages), the endpoint and the model ids, then paste the key there. The key goes into the harness credential store and is never shown again; that store is what every model call uses, so Completo keeps no copy of anything.",
    providersStep1: "Open Settings -> Models.",
    providersStep2: "Press Add model provider and choose Custom model API for any OpenAI- or Anthropic-compatible endpoint.",
    providersStep3: "Fill the provider id, endpoint, protocol and at least one model id, then paste the API key.",
    providersStep4: "Pick that model in a new conversation and send a one-line prompt to prove the key works.",
    envHeading: "Keys the MCP servers read",
    envDesc:
      "The four optional servers are off. A server is a child process: the harness strips every ambient KEY/PASSWORD/SECRET/TOKEN variable before spawning it, so only the env block in cordis.patch.yml reaches it, and that block reads process.env when the row starts. A value typed on this page could therefore never configure a server, which is why there is no box to type one into. Set the variable in the shell that launches DeepSeek Harness, restart it, then switch the row on.",
    envNote: "In that shell:",
    envWhere: "reads",
    envWhy: "why",
    envRestart: "A server reads its key once, when it starts. Re-enable the row after changing a value.",
    noEnvNeeded: "The Playwright browser row needs no key at all, which is why it is the one that ships on.",
    slotHeading: "Completo on the Models page",
    slotDesc: "This card also appears at the bottom of Settings -> Models while Completo is installed.",
  });

  function EnvRow(props) {
    var t = props.t;
    var entry = props.entry;
    return jsx(
      "div",
      { className: "cpt-card" },
      jsx(
        "div",
        { className: "cpt-row" },
        jsx("span", { className: "cpt-name cpt-code" }, entry.name),
        jsx("span", { className: "cpt-tag" }, entry.rows),
      ),
      jsx("p", { className: "cpt-desc" }, entry.why),
      jsx(
        "p",
        { className: "cpt-needs cpt-code" },
        t("envNote") + " " + shellPrefix + entry.name + "=<value>",
      ),
    );
  }

  function ProvidersCard(props) {
    var t = props.t;
    var steps = [t("providersStep1"), t("providersStep2"), t("providersStep3"), t("providersStep4")];
    return jsx(
      "section",
      { className: "cpt-group" },
      jsx("h3", { className: "cpt-heading" }, t("providersHeading")),
      jsx(
        "div",
        { className: "cpt-card" },
        jsx("p", { className: "cpt-desc" }, t("providersDesc")),
        jsx(
          "ol",
          { className: "cpt-steps" },
          steps.map(function (step) {
            return jsx("li", { key: step, className: "cpt-needs" }, step);
          }),
        ),
      ),
      jsx("h3", { className: "cpt-heading" }, t("envHeading")),
      jsx("p", { className: "cpt-desc" }, t("envDesc")),
      ENV_NAMES.map(function (entry) {
        return jsx(EnvRow, { key: entry.name, entry: entry, t: t });
      }),
      jsx("p", { className: "cpt-needs" }, t("noEnvNeeded")),
      jsx("p", { className: "cpt-needs" }, t("envRestart")),
    );
  }

  function ModelFooter(props) {
    var t = props.t;
    return jsx(
      "div",
      { className: "cpt-card" },
      jsx("p", { className: "cpt-desc" }, t("slotHeading")),
      jsx("p", { className: "cpt-needs" }, t("slotDesc")),
    );
  }

  return {
    NS: NS,
    ENV_NAMES: ENV_NAMES,
    component: ProvidersCard,
    ModelFooter: ModelFooter,
  };
}

/**
 * Mount the providers card into the Completo page and the Models footer seat.
 *
 * No credential store is touched: the harness owns providers and their secrets.
 */
function applyProviders(ctx, React, jsx, summary) {
  var def = providersDefinition(React, jsx, summary);
  var t = ctx.locale.bind(def.NS);

  ctx.effect(function () {
    return ctx.slots.register(
      { name: "settings.models.footer", id: "completo-providers", order: 40, locale: def.NS },
      function CompletoModelsFooter() {
        return jsx(def.ModelFooter, { t: t });
      },
    );
  }, "completo-providers: models footer");

  return {
    providers: function ProvidersCard() {
      return jsx(def.component, { t: t });
    },
    ENV_NAMES: def.ENV_NAMES,
  };
}
