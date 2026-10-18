import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readNativeRecipeDraft } from "./native-recipe-drafts.mjs";
import { runtimeFixtureReference } from "./skirmish-matrix-fixtures.mjs";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/native-scenario-recipes.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url), "utf8"));

test("every missing supported runtime case has a distinct authored specification without executable registration", () => {
  const missing = manifest.rows.filter((row) => row.drivers.includes("runtime") && !row.fixture && !row.runtimeSupport);
  assert.deepEqual(fixture.scenarioIds, missing.map((row) => row.id));
  assert.equal(fixture.scenarioIds.length, 86);
  for (const row of missing) {
    assert.equal(row.runtimeRecipeDraft, "native-scenario-recipes.json");
    const entry = readNativeRecipeDraft(fixture, row.id);
    assert.equal(entry.status, "authored_not_executed");
    assert.ok(entry.executionBlockers.includes("native_case_binding"));
    assert.equal(runtimeFixtureReference(row), null);
  }
  assert.equal(manifest.rows.filter((row) => row.runtimeSupport && row.runtimeRecipeDraft).length, 0);
});

test("authoring reader rejects missing identities, requirements, assertions and unknown binding obligations", () => {
  assert.throws(() => readNativeRecipeDraft(fixture, "UNKNOWN-01"), /native_recipe_draft_missing/);
  for (const field of ["setup", "actions", "measurements", "required", "forbidden", "branches", "reuse"]) {
    const copy = structuredClone(fixture);
    copy.cases[0][field] = [];
    assert.throws(() => readNativeRecipeDraft(copy, copy.scenarioIds[0]), /incomplete_native_recipe_draft/);
  }
  for (const missing of ["unknown_hook", "toString"]) {
    const copy = structuredClone(fixture);
    copy.cases[0].executionBlockers.push(missing);
    assert.throws(() => readNativeRecipeDraft(copy, copy.scenarioIds[0]), /unknown_native_recipe_hook/);
  }
  const duplicate = structuredClone(fixture);
  duplicate.cases[1].scenarioId = duplicate.cases[0].scenarioId;
  assert.throws(() => readNativeRecipeDraft(duplicate, duplicate.scenarioIds[0]), /malformed_native_recipe_drafts/);
});

test("authoring records cannot claim runtime evidence or passed execution", () => {
  for (const replacement of [{ evidenceKind: "runtime" }, { status: "passed" }]) {
    assert.throws(
      () => readNativeRecipeDraft({ ...fixture, ...replacement }, fixture.scenarioIds[0]),
      /malformed_native_recipe_drafts/
    );
  }
  const copy = structuredClone(fixture);
  copy.cases[0].status = "passed";
  assert.throws(() => readNativeRecipeDraft(copy, copy.scenarioIds[0]), /incomplete_native_recipe_draft/);
});

test("authoring checkpoints retain a finite ordered ceiling and an explicit sampling limitation", () => {
  for (const ticks of [[], [0, 0, 2000], [0, 2001], [20, 2000]]) {
    const copy = structuredClone(fixture);
    copy.cases[0].checkpointTicks = ticks;
    assert.throws(() => readNativeRecipeDraft(copy, copy.scenarioIds[0]), /incomplete_native_recipe_draft/);
  }
});
