import assert from "node:assert/strict";
import test from "node:test";
import {
  describeRuntimeVariant, validateEvidenceStopAssertions, validateRuntimeRecipeMetadata
} from "./skirmish-runtime-recipe-metadata.mjs";

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

test("early evidence stop requires a subject, a finite stability window and monotonic assertions", () => {
  const subject = { id: "subject", executionKind: "focused_preset", role: "standalone",
    evidenceStop: { earliestTick: 100, stableForTicks: 200 }, presetWorld: { actors: [] } };
  assert.doesNotThrow(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [subject] }));
  assert.throws(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [{ ...subject,
    role: "control", pairId: "test" }] }),
    /runtime_recipe_evidence_stop_invalid/);
  assert.throws(() => validateRuntimeRecipeMetadata({ ...recipe, variants: [{ ...subject,
    evidenceStop: { earliestTick: 300, stableForTicks: 200 } }] }), /runtime_recipe_evidence_stop_invalid/);
  const fixture = { scenarioIds: ["PRO-01"], recipe: { ...recipe, variants: [subject] },
    assertions: { "PRO-01": { minimumDecisions: 2, minimumAppliedCommands: 1,
      requiredAiFactions: ["Tivara"], minimumMilitaryCount: 3 } } };
  assert.doesNotThrow(() => validateEvidenceStopAssertions(fixture));
  fixture.assertions["PRO-01"].maximumMilitaryProducerCount = 2;
  assert.throws(() => validateEvidenceStopAssertions(fixture), /runtime_recipe_evidence_stop_unsafe/);
});
