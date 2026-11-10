/**
 * WCAG contrast check for the Completo Studio palette.
 *
 * Independent of src/ on purpose: it imports nothing, so a broken theme module
 * cannot make its own colours look fine. Keep TOKENS in sync with
 * `src/theme/palette.js` — `npm run check` runs this and `npm test` compares the
 * two tables.
 */

/** Same table as src/theme/palette.js. */
export const TOKENS = {
  "--dsw-alias-bg-base": { light: "#f7f4ec", dark: "#16181a" },
  "--dsw-alias-bg-layer-1": { light: "#fffdf7", dark: "#1e2124" },
  "--dsw-alias-bg-layer-2": { light: "#f2eee3", dark: "#262a2e" },
  "--dsw-alias-bg-overlay": { light: "#fffdf7", dark: "#2b3035" },
  "--dsw-alias-border-l1": { light: "#e3dccd", dark: "#34393e" },
  "--dsw-alias-border-l2": { light: "#cfc6b3", dark: "#464c53" },
  "--dsw-alias-brand-primary": { light: "#0d8a7a", dark: "#4fd8c0" },
  "--dsw-alias-label-primary": { light: "#1d1f1c", dark: "#f2f1ea" },
  "--dsw-alias-label-secondary": { light: "#5b5f58", dark: "#b6bcc2" },
  "--dsw-alias-state-error-primary": { light: "#b3352c", dark: "#ff8f84" },
  "--dsw-alias-state-idle-primary": { light: "#868980", dark: "#8b9199" },
  "--dsw-alias-state-success-primary": { light: "#1f7a4d", dark: "#6fdca2" },
  "--dsw-alias-state-warn-primary": { light: "#8a5a12", dark: "#f0bf6a" },
  "--dsw-specific-sidebar-fill": { light: "#f1ede2", dark: "#1a1d20" },
};

/**
 * Pairs that must stay readable, with the ratio they must clear.
 * 4.5 is AA body text; 3.0 is AA large text and non-text UI.
 */
export const PAIRS = [
  ["--dsw-alias-label-primary", "--dsw-alias-bg-base", 4.5],
  ["--dsw-alias-label-primary", "--dsw-alias-bg-layer-1", 4.5],
  ["--dsw-alias-label-primary", "--dsw-alias-bg-layer-2", 4.5],
  ["--dsw-alias-label-primary", "--dsw-alias-bg-overlay", 4.5],
  ["--dsw-alias-label-primary", "--dsw-specific-sidebar-fill", 4.5],
  ["--dsw-alias-label-secondary", "--dsw-alias-bg-base", 4.5],
  ["--dsw-alias-label-secondary", "--dsw-alias-bg-layer-1", 4.5],
  ["--dsw-alias-label-secondary", "--dsw-alias-bg-layer-2", 4.5],
  ["--dsw-alias-label-secondary", "--dsw-specific-sidebar-fill", 4.5],
  ["--dsw-alias-brand-primary", "--dsw-alias-bg-base", 3.0],
  ["--dsw-alias-brand-primary", "--dsw-alias-bg-layer-1", 3.0],
  ["--dsw-alias-brand-primary", "--dsw-specific-sidebar-fill", 3.0],
  ["--dsw-alias-state-error-primary", "--dsw-alias-bg-base", 4.5],
  ["--dsw-alias-state-success-primary", "--dsw-alias-bg-base", 4.5],
  ["--dsw-alias-state-warn-primary", "--dsw-alias-bg-base", 4.5],
  ["--dsw-alias-state-idle-primary", "--dsw-alias-bg-base", 3.0],
  ["--dsw-alias-border-l2", "--dsw-alias-bg-layer-1", 1.4],
];

/** Relative luminance per WCAG 2.1. */
export function luminance(hex) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
  const [r, g, b] = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colours, 1..21. */
export function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** Every failing pair across both schemes. */
export function failures(tokens = TOKENS, pairs = PAIRS) {
  const out = [];
  for (const scheme of ["light", "dark"]) {
    for (const [foreground, background, minimum] of pairs) {
      const value = contrast(tokens[foreground][scheme], tokens[background][scheme]);
      if (value < minimum) {
        out.push({ scheme, foreground, background, value: Number(value.toFixed(2)), minimum });
      }
    }
  }
  return out;
}

// Run as a script: print the table, fail on a regression.
if (process.argv[1] && process.argv[1].endsWith("contrast.mjs")) {
  const bad = failures();
  for (const scheme of ["light", "dark"]) {
    const worst = PAIRS.map(([foreground, background]) => ({
      foreground,
      value: contrast(TOKENS[foreground][scheme], TOKENS[background][scheme]),
      minimum: PAIRS.find(([f, b]) => f === foreground && b === background)[2],
    })).sort((a, b) => a.value - b.value)[0];
    console.log(`contrast ${scheme}: ${PAIRS.length} pairs, tightest ${worst.foreground} at ${worst.value.toFixed(2)}:1 (min ${worst.minimum})`);
  }
  if (bad.length > 0) {
    console.error(`contrast: ${bad.length} failing pairs`);
    for (const failure of bad) console.error(`  ${failure.scheme} ${failure.foreground} on ${failure.background}: ${failure.value} < ${failure.minimum}`);
    process.exit(1);
  }
  console.log("contrast: all pairs pass");
}
