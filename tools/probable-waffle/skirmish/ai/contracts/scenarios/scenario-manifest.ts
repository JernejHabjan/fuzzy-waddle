import type { ScenarioManifestRow } from "./scenario-manifest-row.ts";

/** Validated scenario selection authority; registration alone is never execution evidence. */
export interface ScenarioManifest {
  schemaVersion: number;
  manifestVersion: string;
  requiredCaseCount: number;
  baseline: string;
  defaultSeeds: number[];
  rows: ScenarioManifestRow[];
}
