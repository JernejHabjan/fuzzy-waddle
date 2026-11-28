import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ScenarioManifest } from "../contracts/scenarios/scenario-manifest.ts";
import { fixtureDirectory, workspaceRoot } from "../shared/workspace-paths.ts";

const testingDirectory = join(
  workspaceRoot,
  "libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing"
);
const requirementFiles = [
  "strategic-scenarios.md",
  "adversarial-scenarios.md",
  "classic-rts-and-difficulty-scenarios.md",
  "debugging-scenarios.md"
];

export const groupNames = {
  economy: "Economy and workers",
  production: "Production and composition",
  technology: "Technology and counters",
  scouting: "Scouting and knowledge",
  strategy: "Strategic purpose",
  access: "Access and transport",
  combat: "Combat and squads",
  placement: "Placement",
  fortification: "Walls and fortifications",
  recovery: "Recovery and liveness",
  authority: "Command authority",
  reservations: "Resources and reservations",
  lanes: "Decision-lane fairness",
  lifecycle: "Save, reload and disposal",
  continuous: "Continuous matches",
  "classic-rts": "Classic RTS behavior",
  difficulty: "Difficulty",
  debug: "Debugging and reproduction"
};

export interface ScenarioRequirement {
  id: string;
  source: string;
  setup: string | null;
  result: string;
}

/** Parses the authored scenario tables used by the development scenario browser. */
export function parseRequirementRows(source: string, document: string): ScenarioRequirement[] {
  const rows: ScenarioRequirement[] = [];
  for (const line of document.split(/\r?\n/)) {
    const id = line.match(/^\|\s*([A-Z]+-[0-9]{2})\s*\|/);
    if (!id) continue;
    const cells = line
      .split(/(?<!\\)\|/)
      .slice(2, -1)
      .map((cell) => cell.trim());
    if (cells.length < 1 || cells.length > 2 || cells.some((cell) => !cell)) {
      throw new Error(`invalid_scenario_requirement:${source}:${id[1]}`);
    }
    rows.push({ id: id[1], source, setup: cells.length === 2 ? cells[0] : null, result: cells.at(-1)! });
  }
  return rows;
}

export function readScenarioRequirements(): Map<string, ScenarioRequirement> {
  const requirements = new Map<string, ScenarioRequirement>();
  for (const source of requirementFiles) {
    for (const row of parseRequirementRows(source, readFileSync(join(testingDirectory, source), "utf8"))) {
      if (requirements.has(row.id)) throw new Error(`duplicate_scenario_requirement:${row.id}`);
      requirements.set(row.id, row);
    }
  }
  return requirements;
}

/** Ensures every executable identity has a concise browser description, without generating a duplicate catalog. */
export function validateScenarioRequirements(manifest: ScenarioManifest): void {
  const requirements = readScenarioRequirements();
  const ids = new Set(manifest.rows.map((row) => row.id));
  if (manifest.rows.length !== manifest.requiredCaseCount || ids.size !== manifest.rows.length) {
    throw new Error("scenario_requirement_manifest_denominator_mismatch");
  }
  const missing = manifest.rows.filter((row) => !requirements.has(row.id)).map((row) => row.id);
  const unexpected = [...requirements.keys()].filter((id) => !ids.has(id));
  if (missing.length || unexpected.length) {
    throw new Error(`scenario_requirement_mismatch:missing=${missing.join(",")};unexpected=${unexpected.join(",")}`);
  }
}

export function readScenarioManifest(): ScenarioManifest {
  return JSON.parse(readFileSync(join(fixtureDirectory, "skirmish-scenario-manifest.json"), "utf8"));
}
