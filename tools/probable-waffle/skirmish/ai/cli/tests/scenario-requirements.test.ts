import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseRequirementRows,
  readScenarioManifest,
  readScenarioRequirements,
  validateScenarioRequirements
} from "../scenario-requirements.ts";

test("scenario requirements retain explicit setup and result or mark missing setup", () => {
  const rows = parseRequirementRows(
    "examples.md",
    "| ECO-01 | Visible forest without a deposit | Build a useful deposit |\n" +
      "| D-01 | Difficulty profile is selected exactly |\n"
  );
  assert.deepEqual(rows, [
    {
      id: "ECO-01",
      source: "examples.md",
      setup: "Visible forest without a deposit",
      result: "Build a useful deposit"
    },
    { id: "D-01", source: "examples.md", setup: null, result: "Difficulty profile is selected exactly" }
  ]);
  assert.throws(
    () => parseRequirementRows("examples.md", "| ECO-01 | | Build a deposit |"),
    /invalid_scenario_requirement/
  );
});

test("every registered scenario has one browser requirement without a generated Markdown catalog", () => {
  const manifest = readScenarioManifest();
  validateScenarioRequirements(manifest);
  const requirements = readScenarioRequirements();
  assert.equal(manifest.rows.length, 120);
  assert.equal(requirements.size, 120);
  assert.equal(requirements.get("SEQ-01")?.result.includes("victory"), true);
  assert.equal(requirements.get("SCOUT-02")?.setup !== null, true);
});
