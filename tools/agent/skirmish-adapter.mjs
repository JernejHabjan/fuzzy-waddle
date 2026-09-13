import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Converts manifest-backed AI scenarios into generic retained verification commands. */
export function selectSkirmishScenarios(root, { mode, scenarioIds, seed }) {
  if (!Array.isArray(scenarioIds) || scenarioIds.length === 0 || new Set(scenarioIds).size !== scenarioIds.length)
    throw new Error("invalid_skirmish_scenarios");
  if (!new Set(["pure", "runtime", "both"]).has(mode)) throw new Error(`invalid_skirmish_mode:${mode ?? "missing"}`);
  if (seed !== null && (!Number.isInteger(seed) || seed < 0)) throw new Error("invalid_skirmish_seed");
  const manifestPath = "tools/ai/fixtures/skirmish-v1.json";
  const manifest = readManifest(root, manifestPath);
  const rows = scenarioIds.map((id) => findScenario(manifest, id));
  validateMode(manifest, rows, mode);
  const arguments_ = ["ai:skirmish-matrix", "--scenarios", scenarioIds.join(","), "--mode", mode];
  if (seed !== null) arguments_.push("--seed", String(seed));
  return {
    configured: true,
    manifest: [manifestPath],
    projects: ["portal", "portal-e2e", "probable-waffle-gameplay", "probable-waffle-phaser"],
    scenarios: rows.map((row) => row.id),
    checks: [
      {
        id: "skirmish-scenarios",
        projects: ["probable-waffle-gameplay", "probable-waffle-phaser", "portal", "portal-e2e"],
        commands: [{ executable: "pnpm", arguments: arguments_ }]
      }
    ]
  };
}

function readManifest(root, path) {
  try {
    const value = JSON.parse(readFileSync(resolve(root, path), "utf8"));
    if (!Array.isArray(value?.rows)) throw new Error();
    return { path, rows: value.rows, root };
  } catch {
    throw new Error("invalid_skirmish_manifest");
  }
}

function findScenario(manifest, id) {
  const row = manifest.rows.find((candidate) => candidate?.id === id);
  if (!row || !Array.isArray(row.drivers)) throw new Error(`unknown_skirmish_scenario:${id}`);
  return row;
}

function validateMode(manifest, rows, mode) {
  const requiredDrivers = mode === "both" ? ["pure", "runtime"] : [mode];
  const deferred = rows.filter((row) => requiredDrivers.some((driver) => !row.drivers.includes(driver)));
  if (deferred.length > 0) throw new Error(`skirmish_driver_deferred:${deferred.map((row) => row.id).join(",")}`);
  const missingFixture = rows.filter((row) => missingFixtureForMode(manifest, row, mode));
  if (missingFixture.length > 0)
    throw new Error(`skirmish_fixture_deferred:${missingFixture.map((row) => row.id).join(",")}`);
}

function missingFixtureForMode(manifest, row, mode) {
  const wantsPure = mode === "pure" || mode === "both";
  const wantsRuntime = mode === "runtime" || mode === "both";
  return (wantsPure && !hasPureFixture(manifest, row)) || (wantsRuntime && !hasRuntimeFixture(manifest, row));
}

function hasPureFixture(manifest, row) {
  return (
    fixtureMatches(manifest, row.authoredFixture, row.id, "pure") ||
    fixtureMatches(manifest, row.fixture, row.id, "pure")
  );
}

function hasRuntimeFixture(manifest, row) {
  return fixtureMatches(manifest, row.fixture, row.id, "runtime");
}

function fixtureMatches(manifest, fixturePath, scenarioId, driver) {
  if (typeof fixturePath !== "string") return false;
  try {
    const fixture = JSON.parse(readFileSync(resolve(manifest.root, "tools/ai/fixtures", fixturePath), "utf8"));
    return fixture.driver === driver && Array.isArray(fixture.scenarioIds) && fixture.scenarioIds.includes(scenarioId);
  } catch {
    return false;
  }
}
