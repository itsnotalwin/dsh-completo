import assert from "node:assert/strict";
import test from "node:test";
import { apply, inject, name } from "../src/skills/index.js";
import { PROVIDER_NAME } from "../src/skills/registry.js";

test("the skills plugin declares what the composition expects", () => {
  assert.equal(name, "completo-skills");
  assert.deepEqual(inject, ["skills"]);
});

test("apply waits for the skills service and registers one provider", async () => {
  const providers = [];
  const effects = [];
  const ctx = {
    effect(run, label) {
      effects.push(label);
      return run();
    },
    skills: {
      registerProvider(factory) {
        providers.push(factory());
        return () => {};
      },
    },
  };

  apply(ctx);

  assert.equal(providers.length, 1);
  assert.equal(effects.length, 1);
  assert.match(effects[0], /completo-skills/u);
  const provider = providers[0];
  assert.equal(provider.name, PROVIDER_NAME);
  const candidates = await provider.list();
  assert.equal(candidates.length, 9);
  const definition = await provider.get(candidates[0]);
  assert.ok(definition.content.includes("# "));
});
