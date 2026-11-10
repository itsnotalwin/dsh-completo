/**
 * Completo: the "Providers & API keys" surface.
 *
 * The harness already owns the safe provider surface (Settings -> Models) and the
 * only writable credential store. This card does three things and nothing more:
 *   - says where a provider is added (never rebuilds the Models page);
 *   - reports key state for the environment variables Completo's MCP rows read,
 *     through the write-only credentials Remote (no value ever comes back);
 *   - stores or clears one of those variables on the user's behalf.
 *
 * It is inert when the browser composition has no `remote` wiring, so the page
 * still renders in tests and in stripped builds.
 */
function providersDefinition(React, jsx, summary) {
  var Fragment = React.Fragment;
  var NS = "completo.discovery";
  // One dictionary per namespace: pageDefinition.en is the single object the page
  // serves, so every key below lands in it before apply() registers the locale.
  var en = pageDefinition.en;
  // The Completo page registers exactly one dictionary object for the whole
  // namespace, so the provider strings must land INSIDE that object. Copying here
  // would register a second, smaller table and leave these strings unresolved.
  if (en === undefined || en === null || typeof en !== "object") {
    throw new Error("completo-providers: pageDefinition.en is missing; the page module must load first");
  }
  // The machine the MCP child processes actually inherit. This is the honest
  // answer to "where does my key have to be", so it is stated per platform.
  var isWindows = typeof navigator === "object" && navigator !== null && /Windows/i.test(String(navigator.userAgent ?? ""));
  var exportHint = isWindows
    ? "$env:GITHUB_TOKEN = 'ghp_...'   (PowerShell; cmd.exe: set GITHUB_TOKEN=ghp_...)"
    : "export GITHUB_TOKEN=ghp_...";

  // Exactly the environment variables cordis.patch.yml reads. Names must match
  // the credential ref grammar: ^[A-Za-z_][A-Za-z0-9_]*$
  var SECRETS = [
    {
      ref: "GITHUB_TOKEN",
      row: "completo-mcp-github",
      label: "GitHub token",
      hint: "A personal access token with repository read. That server runs from the Docker image ghcr.io/github/github-mcp-server.",
    },
    {
      ref: "CONTEXT7_API_KEY",
      row: "completo-mcp-context7",
      label: "Context7 API key",
      hint: "Optional. Raises the documentation lookup limits; the server works without it.",
    },
    {
      ref: "DATABASE_URL",
      row: "completo-mcp-postgres",
      label: "Database URL",
      hint: "A read-only connection string for a scratch database. Never point it at production.",
    },
  ];


  Object.assign(en, {
    providersHeading: "Providers & API keys",
    providersDesc:
      "Model providers and their API keys live in the harness itself. Add or change one under Settings -> Models -> Add model provider -> Custom model API: pick the protocol (OpenAI Chat Completions, OpenAI Responses or Anthropic Messages), the endpoint and the model ids, then paste the key there. The key goes into the harness credential store and is never shown again; that store is what every model call uses, so Completo keeps no second copy.",
    providersStep1: "Open Settings -> Models.",
    providersStep2: "Press Add model provider and choose Custom model API for any OpenAI- or Anthropic-compatible endpoint.",
    providersStep3: "Fill the provider id, endpoint, protocol and at least one model id, then paste the API key.",
    providersStep4: "Pick that model in a new conversation and send a one-line prompt to prove the key works.",
    secretsHeading: "Keys the MCP servers here read",
    secretsDesc:
      "Those servers are off until you switch one on. A server is a child process: the harness drops ambient KEY/PASSWORD/SECRET/TOKEN variables before spawning it, and only the env block in cordis.patch.yml reaches it. That block reads process.env at launch, so the reliable route is the shell line printed under each row - then restart the harness so the row starts with it.",
    secretsUnavailable: "key status unavailable",
    configured: "set",
    notConfigured: "not set",
    save: "Save to the store",
    clear: "Forget it",
    saving: "Saving...",
    envNote: "Set it in your shell instead:",
    restartNote: "A server reads its key when it starts, so re-enable the row after changing one.",
    storedNote: "Saved here, the value is kept in the harness credential store under this name; it reaches an MCP server only when the launching environment also carries it.",
    slotHeading: "Completo on the Models page",
    slotDesc: "This card also appears at the bottom of Settings -> Models while Completo is installed.",
    emptyValue: "Enter a value first.",
  });

  function tagClass(on) {
    return on ? "cpt-tag cpt-focused" : "cpt-tag";
  }

  function StateTag(props) {
    var t = props.t;
    if (props.state === undefined) return jsx("span", { className: "cpt-tag" }, t("secretsUnavailable"));
    return jsx("span", { className: tagClass(props.state) }, props.state ? t("configured") : t("notConfigured"));
  }

  function SecretRow(props) {
    var t = props.t;
    var secret = props.secret;
    var controller = props.controller;
    var inputId = "cpt-key-" + secret.ref;
    var busy = controller.busy === secret.ref;
    return jsx(
      "div",
      { className: "cpt-card" },
      jsx(
        "div",
        { className: "cpt-row" },
        jsx("label", { className: "cpt-name cpt-code", htmlFor: inputId }, secret.ref),
        jsx(StateTag, { t: t, state: controller.state[secret.ref] }),
        jsx(
          "button",
          {
            type: "button",
            className: "cpt-button",
            disabled: busy,
            onClick: function () {
              controller.clear(secret.ref);
            },
          },
          t("clear"),
        ),
      ),
      jsx("p", { className: "cpt-desc" }, secret.label + " for " + secret.row + ". " + secret.hint),
      jsx(
        "div",
        { className: "cpt-row" },
        jsx("input", {
          id: inputId,
          className: "cpt-input cpt-code",
          type: "password",
          autoComplete: "off",
          spellCheck: false,
          placeholder: "paste a value; it is stored and forgotten",
          value: controller.drafts[secret.ref] === undefined ? "" : controller.drafts[secret.ref],
          onChange: function (event) {
            controller.draft(secret.ref, event.target.value);
          },
        }),
        jsx(
          "button",
          {
            type: "button",
            className: "cpt-button cpt-button-primary",
            disabled: busy,
            onClick: function () {
              controller.save(secret.ref);
            },
          },
          busy ? t("saving") : t("save"),
        ),
      ),
      jsx("p", { className: "cpt-needs cpt-code" }, t("envNote") + " " + secret.ref + "=<value>   " + exportHint.replace("GITHUB_TOKEN", secret.ref)),
      jsx("p", { className: "cpt-needs" }, t("storedNote")),
    );
  }

  function ProvidersCard(props) {
    var t = props.t;
    var controller = props.controller;
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
      jsx("h3", { className: "cpt-heading" }, t("secretsHeading")),
      jsx("p", { className: "cpt-desc" }, t("secretsDesc")),
      SECRETS.map(function (secret) {
        return jsx(SecretRow, { key: secret.ref, secret: secret, t: t, controller: controller });
      }),
      jsx("p", { className: "cpt-needs" }, t("restartNote")),
      controller.message === "" ? null : jsx("p", { className: "cpt-needs cpt-focused" }, controller.message),
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

  /**
   * status: {state: {REF: boolean|undefined}}
   * actions: {set(ref, value), unset(ref)} - both resolve to an error string or undefined
   */
  function createSecretsController(status, actions) {
    function touch() {
      this.revision += 1;
    }
    function draft(ref, value) {
      this.drafts[ref] = value;
      this.touch();
    }
    function fail(self, failure) {
      self.busy = "";
      self.message = String(failure && failure.message ? failure.message : failure);
      self.touch();
    }
    function store(ref, value) {
      var self = this;
      var clean = typeof value === "string" ? value.trim() : "";
      if (clean === "") {
        this.message = status.emptyValue;
        this.touch();
        return;
      }
      this.busy = ref;
      this.touch();
      actions
        .set(ref, clean)
        .then(function (error) {
          self.busy = "";
          if (error === undefined) {
            self.drafts[ref] = "";
            self.state[ref] = true;
            self.message = ref + ": saved.";
          } else {
            self.message = error;
          }
          self.touch();
        })
        .catch(function (failure) {
          fail(self, failure);
        });
    }
    function clear(ref) {
      var self = this;
      this.busy = ref;
      this.touch();
      actions
        .unset(ref)
        .then(function (error) {
          self.busy = "";
          if (error === undefined) {
            self.state[ref] = false;
            self.message = ref + ": cleared.";
          } else {
            self.message = error;
          }
          self.touch();
        })
        .catch(function (failure) {
          fail(self, failure);
        });
    }
    return {
      state: status.state,
      drafts: {},
      busy: "",
      message: "",
      revision: 0,
      draft: draft,
      save: store,
      clear: clear,
      touch: touch,
    };
  }

  return {
    NS: NS,
    SECRETS: SECRETS,
    component: ProvidersCard,
    ModelFooter: ModelFooter,
    StateTag: StateTag,
    createSecretsController: createSecretsController,
  };
}

/**
 * Mount the providers card into the Completo page and the Models footer seat.
 *
 * The `remote` namespaces are declared in the bundle's own `inject`, so
 * `ctx.remote.credentials` exists whenever the harness serves them.
 */
function applyProviders(ctx, React, jsx, summary) {
  var def = providersDefinition(React, jsx, summary);
  var remote = typeof ctx.remote === "object" && ctx.remote !== null ? ctx.remote : undefined;
  var credentials = remote === undefined ? undefined : remote.credentials;
  var status = { state: {} };
  status.emptyValue = pageDefinition.en.emptyValue;

  function refusal(response, prefix) {
    var reason = response && response.error && response.error.message ? response.error.message : "the harness refused the call";
    return prefix + ": " + reason;
  }

  var controller = def.createSecretsController(status, {
    set: function (ref, value) {
      if (credentials === undefined) return Promise.resolve("Saving keys needs the harness connection, which this page cannot see.");
      return credentials.set(ref, value).then(function (response) {
        return response && response.ok ? undefined : refusal(response, "Could not store the value");
      });
    },
    unset: function (ref) {
      if (credentials === undefined) return Promise.resolve("Clearing keys needs the harness connection, which this page cannot see.");
      return credentials.unset(ref).then(function (response) {
        return response && response.ok ? undefined : refusal(response, "Could not clear the value");
      });
    },
  });

  function refresh() {
    if (credentials === undefined || typeof credentials.describe !== "function") return;
    var refs = def.SECRETS.map(function (secret) {
      return secret.ref;
    });
    credentials
      .describe(refs)
      .then(function (response) {
        if (!response || !response.ok) return;
        var views = response.value === undefined ? {} : response.value;
        for (var i = 0; i < refs.length; i += 1) {
          var view = views[refs[i]];
          status.state[refs[i]] = view ? view.configured === true : false;
        }
        controller.touch();
      })
      .catch(function () {
        // Status is a convenience: a failed read leaves the tags unknown.
      });
  }

  var t = ctx.locale.bind(def.NS);
  ctx.effect(function () {
    return ctx.slots.register(
      { name: "settings.models.footer", id: "completo-providers", order: 40, locale: def.NS },
      function CompletoModelsFooter() {
        return jsx(def.ModelFooter, { t: t });
      },
    );
  }, "completo-providers: models footer");

  refresh();

  return {
    providers: function ProvidersCard() {
      return jsx(def.component, { t: t, controller: controller });
    },
    refresh: refresh,
    controller: controller,
    SECRETS: def.SECRETS,
  };
}
