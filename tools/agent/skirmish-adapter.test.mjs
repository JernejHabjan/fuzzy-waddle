import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { selectSkirmishScenarios } from "./skirmish-adapter.mjs";

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-skirmish-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, "tools/ai/fixtures"), { recursive: true });
  await writeFile(
    resolve(root, "tools/ai/fixtures/skirmish-v1.json"),
    JSON.stringify({
      rows: [
        {
          id: "ECO-08",
          drivers: ["pure", "runtime"],
          fixture: "runtime.json",
          authoredFixture: "pure.json"
        },
        { id: "PURE-ONLY", drivers: ["pure"], authoredFixture: "pure-only.json" }
      ]
    })
  );
  await writeFile(
    resolve(root, "tools/ai/fixtures/runtime.json"),
    JSON.stringify({ driver: "runtime", scenarioIds: ["ECO-08"] })
  );
  await writeFile(
    resolve(root, "tools/ai/fixtures/pure.json"),
    JSON.stringify({ driver: "pure", scenarioIds: ["ECO-08"] })
  );
  await writeFile(
    resolve(root, "tools/ai/fixtures/pure-only.json"),
    JSON.stringify({ driver: "pure", scenarioIds: ["PURE-ONLY"] })
  );
  return root;
}

test("keeps an authored scenario on the existing matrix runner", async (t) => {
  const root = await fixture(t);
  const selection = selectSkirmishScenarios(root, { scenarioIds: ["ECO-08"], mode: "runtime", seed: 7 });
  assert.deepEqual(selection.scenarios, ["ECO-08"]);
  assert.deepEqual(selection.checks[0].commands[0], {
    executable: "pnpm",
    arguments: ["ai:skirmish-matrix", "--scenarios", "ECO-08", "--mode", "runtime", "--seed", "7"]
  });
  assert.equal(selectSkirmishScenarios(root, { scenarioIds: ["ECO-08"], mode: "both", seed: 7 }).configured, true);
});

test("fails closed for unknown, deferred, or duplicate scenario work", async (t) => {
  const root = await fixture(t);
  assert.throws(
    () => selectSkirmishScenarios(root, { scenarioIds: ["UNKNOWN"], mode: "runtime", seed: null }),
    /unknown_skirmish_scenario/u
  );
  assert.throws(
    () => selectSkirmishScenarios(root, { scenarioIds: ["ECO-08", "ECO-08"], mode: "runtime", seed: null }),
    /invalid_skirmish_scenarios/u
  );
  assert.throws(
    () => selectSkirmishScenarios(root, { scenarioIds: ["PURE-ONLY"], mode: "both", seed: null }),
    /skirmish_driver_deferred/u
  );
});

test("requires fixture provenance to name the scenario and requested driver", async (t) => {
  const root = await fixture(t);
  await writeFile(
    resolve(root, "tools/ai/fixtures/runtime.json"),
    JSON.stringify({ driver: "runtime", scenarioIds: ["OTHER"] })
  );
  assert.throws(
    () => selectSkirmishScenarios(root, { scenarioIds: ["ECO-08"], mode: "runtime", seed: null }),
    /skirmish_fixture_deferred/u
  );
});
