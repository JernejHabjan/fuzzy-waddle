import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRequirementRows, renderCatalog } from "./generate-skirmish-test-catalog.mjs";

test("catalog requirements retain explicit setup and result or mark missing setup", () => {
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
    /invalid_catalog_requirement/
  );
});

test("catalog includes all scenario identities and distinguishes wiring from passing evidence", () => {
  const catalog = renderCatalog();
  const scenarioSection = catalog.split("## Registered runtime variants")[0];
  const ids = [...scenarioSection.matchAll(/^\| \[([^\]]+)\]\([^)]*\) \|/gm)].map(
    (match) => match[1].match(/[A-Z]+-[0-9]{2}/)?.[0]
  );
  assert.equal(ids.length, 121);
  assert.equal(new Set(ids).size, 121);
  assert.equal(ids.includes(undefined), false);
  assert.match(catalog, /Continuous land-match victory \(SEQ-01\)/);
  assert.match(catalog, /Defend a home raid and resume play \(SEQ-02\)/);
  assert.match(catalog, /Island transport and expansion \(SEQ-05\)/);
  assert.match(catalog, /Registered is not passed/);
  assert.match(catalog, /Registered runtime variants/);
  assert.match(catalog, /focused_preset \/ control \(hidden-position\)/);
  assert.match(catalog, /Deferred: \[#822\]/);
  assert.match(catalog, /86 additional native recipe specifications authored, not executable or executed/);
  assert.match(catalog, /recipe specification/);
  assert.match(catalog, /not executable or run/);
});
