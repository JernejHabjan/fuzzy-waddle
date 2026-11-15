import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { groupNames, readRequirements } from "./generate-skirmish-test-catalog.ts";
import { digestString, readHead, requireSha } from "../matrix/skirmish-matrix-io.ts";
import { fixtureDirectory, workspaceRoot } from "../shared/workspace-paths.ts";
import type { ScenarioManifest } from "../contracts/scenarios/scenario-manifest.ts";

/** Stages only manifest-linked browser recipes for the development portal. */
function prepareScenarioBrowser(): void {
  const output = join(workspaceRoot, "tmp/ai-scenario-browser");
  const manifest: ScenarioManifest = JSON.parse(
    readFileSync(join(fixtureDirectory, "skirmish-scenario-manifest.json"), "utf8")
  );
  const sourceRevision = requireSha(readHead(), "scenario_browser_source");
  const requirements = readRequirements();
  const recipes = new Map<string, { name: string; digest: string }>();
  mkdirSync(output, { recursive: true });

  const scenarios = manifest.rows.map((row) => {
    let recipe = null;
    if (row.fixture && row.drivers.includes("runtime") && !row.runtimeSupport) {
      if (!/^native\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.json$/.test(row.fixture)) {
        throw new Error(`invalid_scenario_browser_fixture:${row.fixture}`);
      }
      recipe = recipes.get(row.fixture) ?? null;
      if (!recipe) {
        const text = readFileSync(join(fixtureDirectory, row.fixture), "utf8");
        const digest = digestString(text);
        recipe = { name: `recipe-${recipes.size + 1}.json`, digest };
        writeFileSync(join(output, recipe.name), text);
        recipes.set(row.fixture, recipe);
      }
    }
    const requirement = requirements.get(row.id);
    return {
      id: row.id,
      title: row.name ?? row.id,
      group: groupNames[row.group as keyof typeof groupNames] ?? row.group,
      setup: requirement?.setup ?? null,
      outcome: requirement?.result ?? null,
      unavailable: row.runtimeSupport?.reason ?? (recipe ? null : "No browser recipe is registered."),
      recipe
    };
  });
  writeFileSync(join(output, "catalog.json"), JSON.stringify({ sourceRevision, scenarios }));
}

prepareScenarioBrowser();
