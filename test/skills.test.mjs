import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BUNDLED_RANK, PROVIDER_NAME, SKILL_NAMES, assertSkill } from "../src/skills/registry.js";
import { assetRoot, createProvider, loadSkills, parseSkill } from "../src/skills/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VALID = "---\nname: demo\ndescription: One line.\n---\n\n# Demo\n\nStep one.\n";

test("parseSkill returns the description and the body", () => {
  assert.deepEqual(parseSkill(VALID, "demo"), { description: "One line.", content: "# Demo\n\nStep one." });
});

test("parseSkill strips surrounding quotes and tolerates CRLF", () => {
  const crlf = "---\r\nname: demo\r\ndescription: \"Quoted line.\"\r\n---\r\n\r\nBody\r\n";
  assert.deepEqual(parseSkill(crlf, "demo"), { description: "Quoted line.", content: "Body" });
});

test("parseSkill rejects a file without frontmatter", () => {
  assert.throws(() => parseSkill("# no frontmatter\n", "demo"), /has no YAML frontmatter block/u);
});

test("parseSkill rejects a frontmatter with no description", () => {
  assert.throws(() => parseSkill("---\nname: demo\n---\n\nBody\n", "demo"), /has no description/u);
});

test("assertSkill enforces the name grammar, description and body", () => {
  assert.equal(assertSkill("demo-skill", { description: "x", content: "y" }).description, "x");
  assert.throws(() => assertSkill("Demo_Skill", { description: "x", content: "y" }), /not a valid skill name/u);
  assert.throws(() => assertSkill("demo", { description: "  ", content: "y" }), /no description/u);
  assert.throws(() => assertSkill("demo", { description: "x", content: "   " }), /no body content/u);
});

test("the shipped pack loads every listed skill", () => {
  const skills = loadSkills(assetRoot());
  assert.deepEqual(
    skills.map((skill) => skill.skillName),
    [...SKILL_NAMES],
  );
  for (const skill of skills) {
    assert.ok(skill.description.length > 20, `${skill.skillName} needs a real description`);
    // The model catalog renders one line per skill; a long description is
    // truncated or crowds out the others, so keep it catalog-sized.
    assert.ok(skill.description.length <= 200, `${skill.skillName} description is too long for the catalog`);
    assert.ok(skill.content.length > 400, `${skill.skillName} body is too thin`);
    assert.ok(skill.content.startsWith("# "), `${skill.skillName} body should start with a heading`);
  }
});

test("the registry lists exactly the directories on disk", () => {
  const dirs = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(dirs, [...SKILL_NAMES].sort());
});

test("the provider lists nine candidates and serves content for each", async () => {
  const provider = createProvider(loadSkills(assetRoot()));
  assert.equal(provider.name, PROVIDER_NAME);
  const candidates = await provider.list();
  assert.equal(candidates.length, SKILL_NAMES.length);
  for (const candidate of candidates) {
    assert.equal(candidate.rank, BUNDLED_RANK);
    assert.equal(candidate.source, "bundled");
    assert.equal(candidate.provider, PROVIDER_NAME);
    assert.deepEqual(candidate.invocation, { modelInvocable: true, userInvocable: true });
    assert.equal(candidate.resourceBase.kind, "directory");
    assert.match(candidate.resourceBase.path, /skills\/[a-z0-9-]+$/u);
    assert.ok(candidate.description.length > 0);
    const definition = await provider.get(candidate);
    assert.equal(definition.name, candidate.name);
    assert.equal(definition.provider, PROVIDER_NAME);
    assert.ok(definition.content.length > 400);
    // The summary fields survive; rank and locator are provider bookkeeping.
    assert.equal("locator" in definition, false);
    assert.equal("rank" in definition, false);
  }
});

test("the provider rejects a skill it does not have", async () => {
  const provider = createProvider(loadSkills(assetRoot()));
  await assert.rejects(async () => provider.get({ name: "nope" }), /unknown skill "nope"/u);
});

test("a missing asset directory fails loudly, with the path", () => {
  assert.throws(() => loadSkills(join(ROOT, "skills-missing")), /SKILL\.md is missing \(looked in/u);
});
