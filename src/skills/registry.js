/**
 * The Completo skill curriculum.
 *
 * Every entry names one directory under the bundle's `skills/` folder holding a
 * SKILL.md with YAML frontmatter. `scripts/build.mjs` and
 * `test/skills.test.mjs` both check that this list, the directories, and the
 * frontmatter names agree.
 *
 * The order is the order the curriculum is meant to be read in, not a rank:
 * every Completo skill carries the bundled rank so it sorts with the other
 * bundled packs.
 */
export const SKILL_NAMES = Object.freeze([
  "spec-flow",
  "prompt-crafting",
  "react-vite-base",
  "live-preview",
  "checkpoint-rails",
  "debug-loop",
  "design-pass",
  "release-checklist",
  "ship-audit",
]);

/** Provider identity shown in skill listings and error messages. */
export const PROVIDER_NAME = "completo";

/**
 * Rank recorded on every candidate. Bundled packs sort together; 600 is the
 * shipped `BUNDLED_SKILL_RANK` from `@deepseek-ai/dsh-skill`, repeated here so
 * this module needs no runtime import from the host.
 */
export const BUNDLED_RANK = 600;

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate one parsed skill at load time, so a broken asset fails the boot
 * loudly instead of appearing as a mystery skill with no content.
 * @param name - directory name (also the expected skill name)
 * @param skill - parsed `{ description, content }`
 */
export function assertSkill(name, skill) {
  if (!SKILL_NAME.test(name)) {
    throw new Error(`completo-skills: "${name}" is not a valid skill name (lowercase a-z0-9 and single dashes)`);
  }
  if (typeof skill.description !== "string" || skill.description.trim() === "") {
    throw new Error(`completo-skills: ${name}/SKILL.md has no description in its frontmatter`);
  }
  if (typeof skill.content !== "string" || skill.content.trim() === "") {
    throw new Error(`completo-skills: ${name}/SKILL.md has no body content`);
  }
  return skill;
}
