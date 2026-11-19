import assert from "node:assert/strict";
import { test } from "node:test";
import { collectRuntimeInventory, renderRuntimeInventory } from "../skirmish-runtime-inventory.ts";

test("runtime inventory counts shared variants once and exposes focused migration work", () => {
  const manifest = {
    rows: [
      { id: "PRO-01", group: "production", drivers: ["runtime"], fixture: "mixed.json" },
      { id: "SEQ-01", group: "continuous", drivers: ["runtime"], fixture: "mixed.json" },
      { id: "ECO-01", group: "economy", drivers: ["runtime"] },
      { id: "SEQ-05", group: "continuous", drivers: ["runtime"], runtimeSupport: { status: "deferred_content" } }
    ]
  };
  const fixture = {
    recipe: {
      checkpointTicks: [20, 3000],
      variants: [
        { id: "shared", executionKind: "focused_natural", repetitions: 3, scenarioIds: ["PRO-01", "SEQ-01"] },
        { id: "match", executionKind: "continuous", scenarioIds: ["SEQ-01"] }
      ]
    }
  };
  const inventory = collectRuntimeInventory(manifest, () => fixture);
  assert.equal(inventory.required, 4);
  assert.equal(inventory.missing, 1);
  assert.equal(inventory.deferred, 1);
  assert.equal(inventory.authoredDrafts, 0);
  assert.deepEqual(inventory.recipes[0], {
    path: "mixed.json",
    ids: ["PRO-01", "SEQ-01"],
    variants: 2,
    runs: 4,
    presetVariants: 0,
    maximumTick: 3000,
    scheduledTicks: 12000,
    scheduledCheckpoints: 8,
    combatCaptureVariants: 0,
    evidenceStopVariants: 0,
    flags: ["mixed_focused_continuous", "focused_without_preset", "focused_over_2000", "repeated"]
  });
  assert.match(renderRuntimeInventory(inventory), /2\/4 registered, 1 supported missing, 1 deferred/);
});

test("the static workload counts only checkpoints reachable for the selected rows", () => {
  const manifest = {
    rows: [{ id: "X-01", group: "example", drivers: ["runtime"], fixture: "bounded.json" }]
  };
  const inventory = collectRuntimeInventory(manifest, () => ({
    assertions: { "X-01": { maximumTick: 200 } },
    recipe: {
      checkpointTicks: [20, 200, 400],
      variants: [{ id: "subject", executionKind: "focused_preset", presetWorld: {}, captureCombat: true, repetitions: 2 }]
    }
  }));
  assert.equal(inventory.recipes[0].maximumTick, 200);
  assert.equal(inventory.recipes[0].scheduledTicks, 400);
  assert.equal(inventory.recipes[0].scheduledCheckpoints, 4);
  assert.equal(inventory.recipes[0].combatCaptureVariants, 1);
});

test("native authoring specifications do not reduce missing executable coverage", () => {
  const inventory = collectRuntimeInventory(
    { rows: [{ id: "SCOUT-01", drivers: ["runtime"], fixture: null, runtimeRecipeDraft: "draft.json" }] },
    () => {
      throw new Error("authoring must not load an executable fixture");
    }
  );
  assert.equal(inventory.missing, 1);
  assert.equal(inventory.authoredDrafts, 1);
  assert.deepEqual(inventory.recipes, []);
  assert.match(renderRuntimeInventory(inventory), /0\/1 registered, 1 supported missing/);
  assert.match(renderRuntimeInventory(inventory), /1 authored, not executable or executed/);
});
