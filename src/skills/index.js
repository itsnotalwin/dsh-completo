/**
 * Completo skills — host half.
 *
 * Mirrors the shape of the shipped `@deepseek-ai/dsh-skill-office` provider (the
 * smallest working example of a bundled skill pack): a fixed list of skill
 * directories, each read once at boot, exposed through the `skills` service as a
 * provider with `list` + `get`.
 *
 * Nothing is written to disk and nothing is fetched: the content is the SKILL.md
 * files shipped in the bundle's `skills/` folder.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUNDLED_RANK, PROVIDER_NAME, SKILL_NAMES, assertSkill } from "./registry.js";

export const name = "completo-skills";

/**
 * The provider registry only exists once the `skills` service is up, so this
 * plugin waits for it instead of failing a boot.
 */
export const inject = ["skills"];

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u;

/**
 * Split SKILL.md into its declared description and its body.
 * Behaviorally identical to the shipped office pack, so both look the same to
 * the model.
 * @param raw - file text
 * @param path - source path, for error messages
 * @returns `{ description, content }`
 */
export function parseSkill(raw, path) {
  const frontmatter = FRONTMATTER.exec(raw);
  if (frontmatter === null) throw new Error(`completo-skills: ${path} has no YAML frontmatter block`);
  const description = /^description:[ \t]*(.+)$/mu.exec(frontmatter[1]);
  if (description === null || description[1].trim() === "") {
    throw new Error(`completo-skills: ${path} has no description in its frontmatter`);
  }
  return {
    description: description[1].trim().replace(/^["']|["']$/gu, ""),
    content: raw.slice(frontmatter[0].length).trim(),
  };
}

/**
 * Directory holding the pack: `<bundle>/skills`.
 *
 * Resolved from this module's own location, so a checkout (`dist/skills`) and an
 * installed copy (`node_modules/dsh-completo/dist/skills`) both find it without
 * configuration.
 */
export function assetRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");
}

/**
 * Read every shipped skill once, in curriculum order.
 * @param root - the `skills/` directory
 * @returns parsed skills with their locators
 */
export function loadSkills(root = assetRoot()) {
  return SKILL_NAMES.map((skillName) => {
    const directory = join(root, skillName);
    const path = join(directory, "SKILL.md");
    let raw;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      throw new Error(`completo-skills: ${path} is missing (looked in ${root})`);
    }
    const parsed = assertSkill(skillName, parseSkill(raw, path));
    return { skillName, path, directory, description: parsed.description, content: parsed.content };
  });
}

/**
 * Build the provider the `skills` service consumes.
 * @param skills - result of `loadSkills`
 */
export function createProvider(skills) {
  const candidates = skills.map(({ skillName, description, directory, path }) => ({
    name: skillName,
    description,
    invocation: { modelInvocable: true, userInvocable: true },
    provider: PROVIDER_NAME,
    source: "bundled",
    rank: BUNDLED_RANK,
    resourceBase: { kind: "directory", path: directory.split("\\").join("/") },
    locator: path,
  }));

  return {
    name: PROVIDER_NAME,
    list: () => Promise.resolve(candidates),
    get: (candidate) => {
      const skill = skills.find((entry) => entry.skillName === candidate.name);
      if (skill === undefined) throw new Error(`completo-skills: unknown skill "${candidate.name}"`);
      const { locator: _locator, rank: _rank, ...summary } = candidate;
      return Promise.resolve({ ...summary, content: skill.content });
    },
  };
}

function apply(ctx, config) {
  const skills = loadSkills(config?.assetRoot ?? assetRoot());
  const provider = createProvider(skills);
  ctx.effect(() => ctx.skills.registerProvider(() => provider), "completo-skills: provider");
}

export { apply };

export default { name, inject, apply };
