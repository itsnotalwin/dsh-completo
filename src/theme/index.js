/**
 * Completo Studio — host half.
 *
 * Nothing runs on the host: a theme is a browser feature. This module exists so
 * the theme is a real composition row that can be disabled on its own, like
 * every other harness plugin. The work happens in ./client.js.
 */
export const name = "completo-theme";

export function apply(_ctx) {
  // Intentionally empty — see src/theme/client.js.
}

export default { name, apply };
