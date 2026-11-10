import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const patch = readFileSync(join(ROOT, "cordis.patch.yml"), "utf8");
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

const rows = () => [...patch.matchAll(/^\s+- id: (\S+)$/gm)].map((match) => match[1]);
const block = (id) => patch.split(/^\s+- id: /m).find((part) => part.startsWith(`${id}\n`)) ?? "";

// One row carries theme, page and skills: the client registry rejects a second
// composition source for the same package, so the pack cannot have its own row.
test("the patch mounts the bundle exactly once, by package name", () => {
  const own = [...patch.matchAll(/^\s+name: 'dsh-completo'$/gmu)];
  assert.equal(own.length, 1, "dsh-completo must appear exactly once as a loader source");
  assert.ok(rows().includes("completo"), "the completo row is not mounted");
  assert.match(block("completo"), /name: 'dsh-completo'/u);
});

test("every mounted path exists in the published tarball", () => {
  for (const match of patch.matchAll(/'\.\/dist\/([^']+)'/gu)) {
    assert.ok(existsSync(join(ROOT, "dist", match[1])), `dist/${match[1]} is mounted but missing (run npm run build)`);
  }
});

test("the manifest points at this patch", () => {
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
});

test("five MCP rows, each a separate entry", () => {
  const mcp = rows().filter((row) => row.startsWith("completo-mcp-"));
  assert.deepEqual(mcp, [
    "completo-mcp-playwright",
    "completo-mcp-chrome-devtools",
    "completo-mcp-context7",
    "completo-mcp-github",
    "completo-mcp-postgres",
  ]);
  for (const row of mcp) assert.match(block(row), /name: '@deepseek-ai\/dsh-mcp-client'/u);
});

test("only Playwright is enabled, and it needs no environment", () => {
  const mcp = rows().filter((row) => row.startsWith("completo-mcp-"));
  const enabled = mcp.filter((row) => !/^\s+disabled: true/m.test(block(row)));
  assert.deepEqual(enabled, ["completo-mcp-playwright"]);
  assert.doesNotMatch(block("completo-mcp-playwright"), /env:/u);
});

test("MCP packages are pinned to exact versions", () => {
  for (const match of patch.matchAll(/'(?:@[a-z0-9-]+\/)?[a-z0-9-]+@([0-9][^']*)'/gu)) {
    assert.match(match[1], /^\d+\.\d+\.\d+$/u, `"${match[0]}" is not pinned to x.y.z`);
  }
});

test("every secret is an environment expression, never a literal", () => {
  const envLines = patch.split("\n").filter((line) => /^\s+[A-Z0-9_]+: !!js/u.test(line));
  const dbUrlLines = patch.split("\n").filter((line) => /^\s+- !!js[^\n]*DATABASE_URL/u.test(line));
  const secretLines = [...envLines, ...dbUrlLines];
  assert.ok(secretLines.length >= 3, `expected the three documented secrets, found ${secretLines.length}`);
  for (const line of secretLines) {
    assert.match(line, /!!js[^\n]*process\.env\./u, `secret line is not an env expression: ${line.trim()}`);
    assert.match(line, /\?\?/u, `secret line must tolerate a missing variable: ${line.trim()}`);
  }
  assert.match(patch, /GITHUB_PERSONAL_ACCESS_TOKEN: !!js process\.env\.GITHUB_TOKEN/u);
  assert.match(patch, /CONTEXT7_API_KEY: !!js process\.env\.CONTEXT7_API_KEY/u);
});

test("the postgres row passes its URL as an argument, via the environment", () => {
  const url = block("completo-mcp-postgres");
  assert.match(url, /- !!js String\(process\.env\.DATABASE_URL \?\? ''\)/u);
});

test("the server names are unique and inside the schema's grammar", () => {
  const names = [...patch.matchAll(/serverName: (\S+)/g)].map((match) => match[1]);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) assert.match(name, /^[A-Za-z0-9_-]{1,32}$/u);
});

test("the README's install and removal commands match the CLI", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  assert.match(readme, /dsh plugin --profile \S+ add /u);
  assert.match(readme, /dsh plugin --profile \S+ remove dsh-completo/u);
  assert.match(readme, /--dump-config/u);
  assert.match(readme, /[Nn]ot affiliated with DeepSeek/u);
});
