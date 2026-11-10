/**
 * Completo - host half.
 *
 * One row, one host module: this package must appear exactly once as a Loader
 * source, because the client-modules registry refuses two composition sources for
 * the same package name. So the skills provider lives here rather than in a row
 * of its own.
 *
 * What runs on the host: registering the nine-skill pack with the `skills`
 * service. The theme and the Settings page are browser-side (see
 * `dist/completo-client.js`, which the harness serves to the renderer).
 */
import { createProvider, loadSkills } from "./skills/index.js";

export const name = "completo";

/**
 * The `skills` service arrives after this row mounts, and the pack must not turn a
 * missing service into a failed boot.
 */
export const inject = ["skills"];

function apply(ctx) {
  // Read the pack once at startup: it ships inside the package, so it cannot
  // change under a running profile.
  const skills = loadSkills();
  ctx.effect(
    () => ctx.skills.registerProvider(() => createProvider(skills)),
    "completo: register the nine-skill pack",
  );
}

export { apply };
export { SUMMARY } from "./discovery/index.js";

export default { name, inject, apply };
