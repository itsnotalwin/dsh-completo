/**
 * Completo Studio palette.
 *
 * Every value is a CSS color string. Light and dark sit next to each other so a
 * change is always made twice.
 *
 * Design intent: warm paper (not white) in light mode, warm charcoal (not
 * black) in dark mode, one mint accent used sparingly. Text/background pairs
 * clear WCAG AA for body text; `scripts/contrast.mjs` re-checks them.
 */

/** Ordered token table. Keys are the exact `--dsw-*` names the runtime publishes. */
export const STUDIO_TOKENS = Object.freeze({
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
});

/** Theme ids. Stable: they are what a profile stores when the user picks one. */
export const THEME_LIGHT_ID = "completo-studio-light";
export const THEME_DARK_ID = "completo-studio-dark";

/**
 * Type stacks, offered for copy-paste into Settings → General → Appearance →
 * Font settings. The client theme service exposes no font-family setter to
 * plugins, so Completo cannot apply these itself.
 */
export const TEXT_FONT_STACK = [
  "Aptos Display",
  "Aptos",
  "Segoe UI Variable Display",
  "Segoe UI Variable Text",
  "Segoe UI",
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Inter",
  "Helvetica Neue",
  "Arial",
  "sans-serif",
].join(", ");

export const CODE_FONT_STACK = [
  "Cascadia Code",
  "Cascadia Mono",
  "JetBrains Mono",
  "SF Mono",
  "Consolas",
  "ui-monospace",
  "monospace",
].join(", ");
