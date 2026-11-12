import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings } from "../registration/native-scenario-registration.ts";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.ts";

test("all native bindings retain their full branches and original acceptance obligations", () => {
  const ids = Object.keys(nativeScenarioBindings.cases);
  assert.equal(ids.length, 84);
  const manifest = JSON.parse(
    readFileSync(new URL("../../testing/fixtures/skirmish-scenario-manifest.json", import.meta.url), "utf8")
  );
  for (const id of ids) {
    const row = manifest.rows.find((row) => row.id === id);
    assert.ok(row.fixture.startsWith("native/"));
    assert.ok(row.fixture.includes(`/${id.toLowerCase()}-`));
    assert.equal(row.runtimeRecipeDraft, undefined);
    const fixture = JSON.parse(readFileSync(new URL(`../../testing/fixtures/${row.fixture}`, import.meta.url), "utf8"));
    assert.equal(validNativeScenarioFixture(fixture, id), true);
    assert.ok(fixture.acceptance.required.length > 0);
    assert.ok(fixture.acceptance.forbidden.length > 0);
    assert.equal(fixture.status, "authored_not_executed");
  }
});
