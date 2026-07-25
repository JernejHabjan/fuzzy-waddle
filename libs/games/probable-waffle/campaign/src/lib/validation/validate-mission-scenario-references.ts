import type { ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { isCampaignContentId } from "../contracts/campaign-content-id";
import type { CampaignValidationIssue, CampaignValidationResult } from "./campaign-validation-issue";

export const SCENARIO_REFERENCE_KINDS = [
  "actors",
  "points",
  "regions",
  "routes",
  "groups",
  "cameraShots",
  "spawnSets"
] as const;

export type ScenarioReferenceKind = (typeof SCENARIO_REFERENCE_KINDS)[number];

export interface ScenarioMapManifest {
  readonly mapId: ProbableWaffleMapEnum;
  readonly sceneKey: string;
  readonly actors: readonly string[];
  readonly points: readonly string[];
  readonly regions: readonly string[];
  readonly routes: readonly string[];
  readonly groups: readonly string[];
  readonly cameraShots: readonly string[];
  readonly spawnSets: readonly string[];
}

/** Validates mission JSON references against a map manifest extracted from Phaser Editor content. */
export function validateMissionScenarioReferences(
  mission: CampaignMissionContent,
  map: ScenarioMapManifest,
  sourcePath: string
): CampaignValidationResult {
  const issues: CampaignValidationIssue[] = [];
  if (mission.mapKey !== map.sceneKey) {
    issues.push({
      sourcePath,
      jsonPath: "$.mapKey",
      code: "scenario-map-mismatch",
      message: `Mission map ${mission.mapKey} does not match scenario manifest ${map.mapId} (${map.sceneKey})`
    });
  }

  const namespaceById = new Map<string, ScenarioReferenceKind>();
  for (const kind of SCENARIO_REFERENCE_KINDS) {
    for (const [index, id] of map[kind].entries()) {
      if (!isCampaignContentId(id)) {
        issues.push({
          sourcePath: map.sceneKey,
          jsonPath: `$.${kind}[${index}]`,
          code: "invalid-scenario-reference",
          message: `Scenario ${kind} ID '${id}' in ${map.sceneKey} must use lowercase kebab-case`
        });
      }
      const existingKind = namespaceById.get(id);
      if (existingKind) {
        issues.push({
          sourcePath: map.sceneKey,
          jsonPath: `$.${kind}[${index}]`,
          code: "ambiguous-scenario-reference",
          message: `Scenario ID '${id}' is declared as both ${existingKind} and ${kind} in ${map.sceneKey}`
        });
      } else {
        namespaceById.set(id, kind);
      }
    }
  }

  const required = mission.scenarioReferences;
  if (required) {
    for (const kind of SCENARIO_REFERENCE_KINDS) {
      for (const [index, id] of (required[kind] ?? []).entries()) {
        const actualKind = namespaceById.get(id);
        if (actualKind !== kind) {
          const suffix = actualKind ? `; found in ${actualKind}` : "";
          issues.push({
            sourcePath,
            jsonPath: `$.scenarioReferences.${kind}[${index}]`,
            code: "missing-scenario-reference",
            message: `Map scene ${map.sceneKey} is missing required ${kind} scenario ID '${id}'${suffix}`
          });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
