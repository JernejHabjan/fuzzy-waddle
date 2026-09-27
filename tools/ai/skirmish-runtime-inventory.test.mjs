import assert from "node:assert/strict";
import { test } from "node:test";
import { collectRuntimeInventory, renderRuntimeInventory } from "./skirmish-runtime-inventory.mjs";

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
        { id: "shared", repetitions: 3, scenarioIds: ["PRO-01", "SEQ-01"] },
        { id: "match", scenarioIds: ["SEQ-01"], presetWorld: { fixtureId: "example" } }
      ]
    }
  };
  const inventory = collectRuntimeInventory(manifest, () => fixture);
  assert.equal(inventory.required, 4);
  assert.equal(inventory.missing, 1);
  assert.equal(inventory.deferred, 1);
  assert.deepEqual(inventory.recipes[0], {
    path: "mixed.json",
    ids: ["PRO-01", "SEQ-01"],
    variants: 2,
    runs: 4,
    presetVariants: 1,
    maximumTick: 3000,
    flags: ["mixed_focused_continuous", "focused_without_preset", "focused_over_2000", "repeated"]
  });
  assert.match(renderRuntimeInventory(inventory), /2\/4 registered, 1 supported missing, 1 deferred/);
});
