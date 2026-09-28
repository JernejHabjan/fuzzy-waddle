import assert from "node:assert/strict";
import test from "node:test";
import { describeRuntimeVariant, validateRuntimeRecipeMetadata } from "./skirmish-runtime-recipe-metadata.mjs";

const recipe = { mapLabel: "Frozen Open", checkpointTicks: [20, 400] };

test("focused presets declare a legal starting world and bounded purpose", () => {
  const variant = {
    id: "subject", executionKind: "focused_preset", role: "standalone", seed: 7,
    presetWorld: { actors: [{ actorName: "Worker" }, { actorName: "Worker" }],
      resourceStarts: [{ playerNumber: 2, amounts: { food: 200 } }], queues: [], events: [] }
  };
  assert.doesNotThrow(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [variant] }));
  const detail = describeRuntimeVariant(recipe, variant);
  assert.equal(detail.kind, "focused_preset");
  assert.match(detail.setup, /actors=Worker×2; starts=P2\[food:200\]/);
});

test("rejects missing natural setup reasons and unjustified focused deadlines", () => {
  assert.throws(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [{
    id: "natural", executionKind: "focused_natural", role: "standalone"
  }] }), /runtime_recipe_natural_rationale_missing/);
  assert.throws(() => validateRuntimeRecipeMetadata({ ...recipe, checkpointTicks: [20, 3000], variants: [{
    id: "long", executionKind: "focused_preset", role: "standalone", presetWorld: { actors: [] }
  }] }), /runtime_recipe_deadline_rationale_missing/);
});

test("causal subject and control require the same seed, map and scenario membership", () => {
  const subject = { id: "subject", executionKind: "focused_preset", role: "subject", pairId: "housing",
    seed: 7, scenarioIds: ["ECO-07"], presetWorld: { actors: [] } };
  const control = { ...subject, id: "control", role: "control" };
  assert.doesNotThrow(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [control, subject] }));
  assert.throws(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [subject, { ...control, seed: 8 }] }),
    /runtime_recipe_pair_mismatch:housing/);
});

test("continuous matches cannot masquerade as preset worlds", () => {
  assert.throws(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [{
    id: "match", executionKind: "continuous", role: "standalone", presetWorld: { actors: [] }
  }] }), /runtime_recipe_unexpected_preset/);
});
