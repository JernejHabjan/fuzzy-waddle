import { strict as assert } from "node:assert";
import { test } from "node:test";
import { planSkirmishRuntimeShards } from "./skirmish-ci-shards.mjs";

const fixture = {
  evidenceKind: "runtime",
  driver: "runtime",
  scenarioIds: ["ECO-01", "ECO-02"],
  recipe: { variants: [{ scenarioIds: ["ECO-01", "ECO-02"] }] },
  assertions: { "ECO-01": {}, "ECO-02": {} }
};

test("groups runnable supported rows once and visibly defers only island content", () => {
  const manifest = {
    schemaVersion: 1,
    requiredCaseCount: 3,
    rows: [
      { id: "ECO-01", group: "economy", fixture: "economy.json", drivers: ["pure", "runtime"] },
      { id: "ECO-02", group: "economy", fixture: "economy.json", drivers: ["runtime"] },
      {
        id: "DOMAIN-03", group: "access", fixture: null, drivers: ["pure", "runtime"],
        runtimeSupport: { status: "deferred_content", issue: 822, reason: "island map unavailable" }
      }
    ]
  };
  const plan = planSkirmishRuntimeShards(manifest, () => fixture);
  assert.deepEqual(plan.shards, [{ id: "economy-1", scenarios: "ECO-01,ECO-02" }]);
  assert.deepEqual(plan.deferred.map((entry) => entry.id), ["DOMAIN-03"]);
});

test("fails closed when a supported row has no executable recipe", () => {
  const manifest = {
    schemaVersion: 1,
    requiredCaseCount: 1,
    rows: [{ id: "ECO-01", group: "economy", fixture: null, drivers: ["runtime"] }]
  };
  assert.throws(() => planSkirmishRuntimeShards(manifest, () => fixture), /mandatory_runtime_coverage_missing:ECO-01/);
});

test("rejects fixture metadata that cannot execute the selected row", () => {
  const manifest = {
    schemaVersion: 1,
    requiredCaseCount: 1,
    rows: [{ id: "ECO-01", group: "economy", fixture: "economy.json", drivers: ["runtime"] }]
  };
  assert.throws(
    () => planSkirmishRuntimeShards(manifest, () => ({ ...fixture, assertions: {} })),
    /unrunnable_runtime_fixture:ECO-01/
  );
});
