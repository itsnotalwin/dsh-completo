/**
 * dsh-completo - build.
 *
 * Dependency-free on purpose: the plugin ships plain ESM, so building and
 * verifying it never needs a toolchain installed into the profile.
 *
 * What this script does:
 *
 *   1. copies src/ to dist/ (the host halves stay ES modules);
 *   2. builds the ONE browser bundle the host will serve - exports["./client"],
 *      because the module loader reads a single bundle per package and calls a
 *      single apply. src/client-root.js is the wrapper; the theme half, the page
 *      half, the palette and the shipped summary are spliced into it, since a
 *      module-loader bundle cannot carry imports;
 *   3. validates the composition patch, every SKILL.md, and that the bundle
 *      requires nothing but react.
 *
 * Run with `node scripts/build.mjs` (`npm run build`, also `prepare`).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Exactly one composition row: the client-modules registry rejects a second
// loader source for the same package, so skills and theme share the row.
const ROWS = ["completo"];
const BUNDLE = "completo-client.js";
const NL = String.fromCharCode(10);

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u;

const read = (path) => readFileSync(path, "utf8");

function fail(message) {
  throw new Error("build: " + message);
}

/** The browser bundle may only require what the host module loader provides. */
function assertBrowserSafe(code, file) {
  const allowed = new Set(["react", "react/jsx-runtime"]);
  for (const match of code.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) {
    if (!allowed.has(match[1])) fail(file + ' requires "' + match[1] + '"; the browser bundle may only require react');
  }
  if (!code.includes("window.__ModuleLoader__.load(")) fail(file + " is not a module-loader bundle");
}

/** Characters that need escaping inside a single-quoted JS string literal. */
const LITERAL_ESCAPES = new Map([
  [String.fromCharCode(92), String.fromCharCode(92, 92)],
  [String.fromCharCode(39), String.fromCharCode(92, 39)],
  [NL, String.fromCharCode(92, 110)],
  [String.fromCharCode(13), String.fromCharCode(92, 114)],
  [String.fromCharCode(0x2028), String.fromCharCode(92, 117, 50, 48, 50, 56)],
  [String.fromCharCode(0x2029), String.fromCharCode(92, 117, 50, 48, 50, 57)],
]);

/** Turn source text into one single-quoted string literal that evaluates back to it. */
function quoteLiteral(text) {
  let out = String.fromCharCode(39);
  for (const char of text) out += LITERAL_ESCAPES.get(char) ?? char;
  return out + String.fromCharCode(39);
}

/** Replace a placeholder once, without letting a `$` in the payload act as a pattern. */
function splice(code, placeholder, payload, file) {
  if (!code.includes(placeholder)) fail(file + " lost its " + placeholder + " placeholder");
  return code.replace(placeholder, () => payload);
}

function indent(text, pad) {
  return text
    .split(NL)
    .map((line) => (line.length === 0 ? line : pad + line))
    .join(NL);
}

/** `export const A = ...` -> `const A = ...`, so a module body can be inlined. */
function withoutExports(source) {
  return source
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/\bexport\s+const\s+/g, "const ")
    .replace(/\bexport\s+function\s+/g, "function ")
    .trim();
}

/**
 * The palette as one expression. It lands inside a single-quoted literal, so the
 * module's own double quotes - including the font stacks - need no escaping.
 */
function paletteExpression(source) {
  const body = withoutExports(source);
  if (body.includes("`")) fail("src/theme/palette.js may not use template literals");
  if (/^\s*import\s/m.test(body)) fail("src/theme/palette.js may not import anything");
  const exported = body.match(/^const ([A-Za-z0-9_]+)/gm).map((line) => line.replace(/^const /, ""));
  const expression = "(() => {" + NL + body + NL + "return { " + exported.join(", ") + " };" + NL + "})()";
  // Prove the literal round-trips before it is written into the bundle.
  const literal = quoteLiteral(expression);
  if (quoteLiteral(eval(literal)) !== literal) fail("build: the palette literal does not round-trip"); // eslint-disable-line no-eval
  return literal;
}

/** The shipped summary, parsed out of the host half's frozen literal. */
function summaryExpression(hostSource, version) {
  const match = hostSource.match(/export const SUMMARY = Object\.freeze\(([\s\S]*?)\);\n/);
  if (!match) fail("src/discovery/index.js no longer exports a frozen SUMMARY literal");
  const summary = { ...new Function("return (" + match[1] + ");")(), version };
  return JSON.stringify(JSON.stringify(summary));
}

/** Assemble dist/<BUNDLE> from the wrapper plus the three halves. */
function assembleBundle(version) {
  const wrapper = read(join(ROOT, "src", "client-root.js"));
  const theme = withoutExports(read(join(ROOT, "src", "client", "theme.js")));
  const page = withoutExports(read(join(ROOT, "src", "client", "page.js")));
  const providers = withoutExports(read(join(ROOT, "src", "client", "providers.js")));
  const palette = paletteExpression(read(join(ROOT, "src", "theme", "palette.js")));
  const summary = summaryExpression(read(join(ROOT, "src", "discovery", "index.js")), version);

  // Whole-line placeholders carry their own leading indentation; the payload is
  // already indented, so strip the marker instead of substituting inside a line.
  const line = (code, marker, payload) => {
    if (!code.includes(marker)) fail("src/client-root.js lost its " + marker + " placeholder");
    return code.replace(marker, () => payload);
  };
  let code = wrapper;
  code = line(code, "__NODE_COMPLETO_THEME_PART__", indent(theme, "    "));
  code = line(code, "__NODE_COMPLETO_PAGE_PART__", indent(page, "    "));
  code = line(code, "__NODE_COMPLETO_PROVIDERS_PART__", indent(providers, "    "));
  code = splice(code, "__COMPLETO_PALETTE__", palette, "src/client-root.js");
  code = splice(code, "__COMPLETO_SUMMARY__", summary, "src/client-root.js");
  if (code.includes("__COMPLETO_")) fail("the browser bundle still holds an unexpanded placeholder");
  return code;
}

/** Every SKILL.md must parse the way the provider parses it. */
function validateSkills() {
  const skillsDir = join(ROOT, "skills");
  const registry = read(join(ROOT, "src", "skills", "registry.js"));
  const listed = registry.match(/export const SKILL_NAMES = Object\.freeze\(\[([\s\S]*?)\]\);/);
  if (!listed) fail("src/skills/registry.js no longer declares SKILL_NAMES");
  const names = [...listed[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const dir of dirs) {
    if (!SKILL_NAME.test(dir)) fail("skills/" + dir + " is not a valid skill name");
    if (!names.includes(dir)) fail("skills/" + dir + " exists but is not listed in SKILL_NAMES");
    const raw = read(join(skillsDir, dir, "SKILL.md"));
    const frontmatter = raw.match(FRONTMATTER);
    if (!frontmatter) fail("skills/" + dir + "/SKILL.md has no YAML frontmatter");
    const description = frontmatter[1].match(/^description:[ \t]*(.+)$/m);
    if (!description || description[1].trim() === "") fail("skills/" + dir + "/SKILL.md has no description");
    const declared = frontmatter[1].match(/^name:[ \t]*(.+)$/m);
    const declaredName = declared ? declared[1].trim().replace(/^["']|["']$/g, "") : "";
    if (declaredName !== dir) fail("skills/" + dir + '/SKILL.md declares name "' + declaredName + '"');
    if (raw.slice(frontmatter[0].length).trim() === "") fail("skills/" + dir + "/SKILL.md has no body");
  }
  for (const name of names) {
    if (!dirs.includes(name)) fail('SKILL_NAMES lists "' + name + '" but skills/' + name + "/SKILL.md is missing");
  }
  return names;
}

/** The patch must mount every row the bundle ships, and no secret may be inline. */
function validatePatch() {
  const patch = read(join(ROOT, "cordis.patch.yml"));
  for (const row of ROWS) {
    // A row mounts this package by name; the client-modules registry accepts
    // exactly one such source, so at least one row must carry dsh.client.
    if (!new RegExp("id:\\s*" + row + "\\n\\s+name:\\s*'dsh-completo'", "u").test(patch)) {
      fail("cordis.patch.yml does not mount the " + row + " row");
    }
  }
  const mounted = [...patch.matchAll(/^\s+name:\s*'dsh-completo'/gmu)].length;
  if (mounted < 1) fail("cordis.patch.yml mounts no dsh-completo row");
  if (mounted > 1) {
    fail(
      "cordis.patch.yml mounts dsh-completo " + mounted + " times; the client registry allows one source per package",
    );
  }
  for (const match of patch.matchAll(/'\.\/(dist\/[^']+)'/gu)) {
    if (!existsSync(join(ROOT, match[1]))) fail("cordis.patch.yml mounts " + match[1] + ", which does not exist");
  }
  if (!patch.includes("@deepseek-ai/dsh-mcp-client")) fail("cordis.patch.yml configures no MCP server");
  for (const line of patch.split(NL)) {
    const carriesExpression = /!!js\s+[^\n]*process\.env\./u.test(line);
    if (!carriesExpression && /(TOKEN|KEY|SECRET|PASSWORD|DATABASE_URL)\s*:/u.test(line)) {
      fail('cordis.patch.yml looks like it inlines a secret: "' + line.trim() + '"');
    }
  }
  return patch;
}

function build() {
  const pkg = JSON.parse(read(join(ROOT, "package.json")));
  validateSkills();
  validatePatch();

  const dist = join(ROOT, "dist");
  rmSync(dist, { recursive: true, force: true });
  cpSync(join(ROOT, "src"), dist, { recursive: true });

  const bundlePath = join(dist, BUNDLE);
  const code = assembleBundle(pkg.version);
  assertBrowserSafe(code, "src/client-root.js");
  mkdirSync(dist, { recursive: true });
  writeFileSync(bundlePath, code, "utf8");

  // Host halves keep their own names; the browser halves now live in the bundle.
  for (const stale of [
    "client.js",
    "client-root.js",
    join("client", "page.js"),
    join("client", "theme.js"),
    join("client", "providers.js"),
    join("theme", "client.js"),
    join("discovery", "client.js"),
    join("skills", "client.js"),
  ]) {
    rmSync(join(dist, stale), { force: true });
  }

  // The single composition row mounts dist/index.js, so it must exist and must
  // be the module that registers the pack.
  const entry = join(dist, "index.js");
  if (!existsSync(entry)) fail("dist/index.js is missing; the composition row mounts it");
  const entrySource = read(entry);
  if (!entrySource.includes("registerProvider")) fail("dist/index.js does not register the skill provider");
  if (!entrySource.includes('"./skills/index.js"')) fail("dist/index.js does not import the skill provider");

  const modules = [];
  for (const file of readdirSync(dist, { recursive: true })) {
    const path = join(dist, file);
    if (!file.endsWith(".js")) continue;
    const source = read(path);
    if (source.includes("__COMPLETO_")) fail("dist/" + file + " still holds an unexpanded placeholder");
    // dist/ is what a profile loads and what npm ships: nothing may point back at
    // src/, and no browser half may survive as a second module.
    if (source.includes("src/") && (file === BUNDLE || source.includes("__ModuleLoader__"))) {
      fail("dist/" + file + " still points at src/");
    }
    modules.push(relative(dist, path).split("\\").join("/"));
  }

  console.log(
    "built dsh-completo " + pkg.version + ": " + BUNDLE + " (" + code.length + " bytes) + " + modules.length + " modules",
  );
}

build();
