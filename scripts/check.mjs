/**
 * dsh-completo — static checks that do not need a running harness.
 *
 * `npm run check`. Everything here is a claim the bundle makes in its manifest,
 * its patch, or its README, turned into an assertion:
 *
 *   - the manifest points at files that exist and within the supported range;
 *   - every module parses as ESM (or as a module-loader bundle);
 *   - no browser half requires anything but react;
 *   - every MCP row is disabled unless it is the Playwright row, and every
 *     secret is an environment expression, not a literal;
 *   - the palette clears WCAG AA for body text (via scripts/contrast.mjs).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The client-modules registry allows exactly one active Loader source per
// package: `completo` carries the browser bundle, `skills` must not.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const note = (message) => problems.push(message);
const read = (path) => readFileSync(join(ROOT, path), "utf8");

const manifest = JSON.parse(read("package.json"));

// --- manifest shape -------------------------------------------------------
for (const field of ["name", "version", "description", "license", "icon"]) {
  if (!manifest[field]) note(`package.json has no "${field}"`);
}
if (manifest.license !== "MIT") note(`package.json license is "${manifest.license}", expected MIT`);
if (!manifest.engines?.dsh) note("package.json declares no engines.dsh");
if (manifest.dsh?.bundle?.patch !== "./cordis.patch.yml") note("dsh.bundle.patch must be ./cordis.patch.yml");
if (!existsSync(join(ROOT, manifest.icon))) note(`icon "${manifest.icon}" does not exist`);
for (const path of ["LICENSE", "NOTICE", "README.md", "CHANGES.md", "CONTRIBUTING.md", "cordis.patch.yml"]) {
  if (!existsSync(join(ROOT, path))) note(`${path} is missing`);
}

// The bundle must be installable from the repository alone; any published path
// must exist in the tarball, so dist/ has to be built before packing.
for (const entry of Object.values(manifest.exports ?? {})) {
  if (typeof entry === "string" && entry.startsWith("./dist/") && !existsSync(join(ROOT, entry))) {
    note(`exports points at ${entry}, which does not exist (run npm run build)`);
  }
}

// --- no DeepSeek marks in identity fields ---------------------------------
const identity = [manifest.name, manifest.description, manifest.icon, ...(manifest.keywords ?? [])].join(" ");
if (/\bdeepseek\b/i.test(identity) && !/deepseek-harness/.test(identity)) {
  note("name/description/keywords use a DeepSeek mark; only the neutral keyword \"deepseek-harness\" is allowed");
}

// --- modules parse --------------------------------------------------------
const modules = [];
const walk = (dir) => {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) modules.push(path.split("\\").join("/"));
  }
};
for (const dir of ["src", "scripts", "test", "dist"]) {
  if (existsSync(join(ROOT, dir))) walk(dir);
}
for (const path of modules) {
  try {
    execFileSync(process.execPath, ["--check", join(ROOT, path)], { stdio: "pipe" });
  } catch (error) {
    note(`${path} does not parse: ${error.stderr?.toString().split("\n").slice(0, 3).join(" ")}`);
  }
}

// A browser half may only require what the host module loader provides.
for (const path of modules.filter((p) => p.includes("client.js"))) {
  const code = read(path);
  for (const match of code.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) {
    if (!["react", "react/jsx-runtime"].includes(match[1])) note(`${path} requires "${match[1]}"`);
  }
  if (!code.includes("window.__ModuleLoader__.load(")) note(`${path} is not a module-loader bundle`);
  if (/\bimport\s+[^;]*\sfrom\s+["'][^"']+["']/.test(code)) note(`${path} has a static import; bundles cannot carry one`);
}

// --- patch contract -------------------------------------------------------
const patch = read("cordis.patch.yml");
const rows = [...patch.matchAll(/^\s+- id: (\S+)$/gm)].map((match) => match[1]);
const rowBlocks = patch.split(/^\s+- id: /m).slice(1);
const disabled = new Set(rowBlocks.filter((block) => /^\s+disabled: true/m.test(block)).map((block) => block.split("\n")[0].trim()));

const mcpRows = rows.filter((row) => row.startsWith("completo-mcp-"));
if (mcpRows.length === 0) note("no MCP rows in cordis.patch.yml");
const enabledMcp = mcpRows.filter((row) => !disabled.has(row));
if (enabledMcp.length !== 1 || enabledMcp[0] !== "completo-mcp-playwright") {
  note(`exactly one MCP row may be enabled by default (completo-mcp-playwright); enabled: ${enabledMcp.join(", ") || "none"}`);
}
for (const row of enabledMcp) {
  const block = rowBlocks.find((candidate) => candidate.startsWith(row));
  if (/env:/.test(block)) note(`${row} is enabled and declares env; an enabled row must need no credential`);
}
// One row carries everything: theme, page and skills all hang off `completo`,
// because the client registry allows a single loader source per package.
if (!rows.includes("completo")) note("cordis.patch.yml does not mount the completo row");
if (rows.filter((row) => row === "completo").length !== 1) note("cordis.patch.yml mounts the completo row more than once");
for (const row of rows) {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(row)) note(`row id "${row}" is not a plain lowercase id`);
}
for (const match of patch.matchAll(/name: '\.\/([^']+)'/g)) {
  if (!existsSync(join(ROOT, match[1].replace(/^node_modules\/dsh-completo\//, "")))) {
    note(`cordis.patch.yml mounts ${match[1]}, which is not in the published tarball`);
  }
}
for (const line of patch.split("\n")) {
  const carriesExpression = /!!js\s+[^\n]*process\.env\./u.test(line);
  if (!carriesExpression && /(TOKEN|SECRET|PASSWORD|API_KEY|DATABASE_URL)\s*:/u.test(line)) {
    note(`cordis.patch.yml may inline a secret: "${line.trim()}"`);
  }
}

// --- install surface ------------------------------------------------------
if (Object.keys(manifest.dependencies ?? {}).length > 0) {
  note("the bundle must not depend on runtime packages; it ships its own code");
}
if (!manifest.files?.includes("skills")) note('package.json "files" must include "skills"');
if (!manifest.files?.includes("dist")) note('package.json "files" must include "dist"');

// --- palette contrast -----------------------------------------------------
try {
  const output = execFileSync(process.execPath, [join(ROOT, "scripts", "contrast.mjs")], { stdio: "pipe" }).toString();
  process.stdout.write(output);
} catch (error) {
  note(`contrast: ${error.stdout?.toString() ?? error.message}`);
}

// --- browser halves actually load and register ----------------------------
// A generated bundle can parse and still be wrong (an inlined body that returns
// undefined, a theme with 13 tokens). This runs both client bundles against
// recording stubs of the client services, the same way the renderer would.
try {
  const output = execFileSync(process.execPath, [join(ROOT, "scripts", "client.mjs")], { stdio: "pipe" }).toString();
  process.stdout.write(output);
} catch (error) {
  note(`browser halves: ${(error.stdout?.toString() ?? error.message).trim().split("\n").pop()}`);
}

if (problems.length > 0) {
  console.error(`\ncheck failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`check ok: ${modules.length} modules, ${rows.length} rows, ${mcpRows.length} MCP servers, 1 enabled`);
