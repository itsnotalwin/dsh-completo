import assert from "node:assert/strict";
import test from "node:test";
import { CODE_FONT_STACK, STUDIO_TOKENS, TEXT_FONT_STACK, THEME_DARK_ID, THEME_LIGHT_ID } from "../src/theme/palette.js";
import { TOKENS, contrast, failures } from "../scripts/contrast.mjs";

const REQUIRED = [
  "--dsw-alias-bg-base",
  "--dsw-alias-bg-layer-1",
  "--dsw-alias-bg-layer-2",
  "--dsw-alias-bg-overlay",
  "--dsw-alias-border-l1",
  "--dsw-alias-border-l2",
  "--dsw-alias-brand-primary",
  "--dsw-alias-label-primary",
  "--dsw-alias-label-secondary",
  "--dsw-alias-state-error-primary",
  "--dsw-alias-state-idle-primary",
  "--dsw-alias-state-success-primary",
  "--dsw-alias-state-warn-primary",
  "--dsw-specific-sidebar-fill",
];

test("the palette covers exactly the tokens the theme service publishes", () => {
  assert.deepEqual(Object.keys(STUDIO_TOKENS).sort(), [...REQUIRED].sort());
  for (const [token, modes] of Object.entries(STUDIO_TOKENS)) {
    for (const scheme of ["light", "dark"]) {
      assert.match(modes[scheme], /^#[0-9a-f]{6}$/u, `${token}.${scheme} must be a 6-digit hex colour`);
    }
  }
});

test("every colour is a mirrored light/dark pair", () => {
  for (const [token, modes] of Object.entries(STUDIO_TOKENS)) {
    assert.notEqual(modes.light, modes.dark, `${token} is the same colour in both schemes`);
  }
});

test("the contrast script checks the palette that ships", () => {
  assert.deepEqual(TOKENS, JSON.parse(JSON.stringify(STUDIO_TOKENS)));
});

test("no pair falls below its WCAG minimum", () => {
  const bad = failures();
  assert.deepEqual(bad, [], `failing pairs: ${JSON.stringify(bad)}`);
});

test("contrast() is symmetric and bounded", () => {
  assert.equal(contrast("#000000", "#ffffff"), 21);
  assert.equal(contrast("#ffffff", "#ffffff"), 1);
  assert.equal(contrast("#000000", "#ffffff"), contrast("#ffffff", "#000000"));
});

test("ids and font stacks are stable, documented values", () => {
  assert.equal(THEME_LIGHT_ID, "completo-studio-light");
  assert.equal(THEME_DARK_ID, "completo-studio-dark");
  assert.match(TEXT_FONT_STACK, /^Aptos Display, Aptos, /u);
  assert.match(TEXT_FONT_STACK, /sans-serif$/u);
  assert.match(CODE_FONT_STACK, /monospace$/u);
});
