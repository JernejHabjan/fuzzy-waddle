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

/**
 * Defines the scenario reference kind alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioReferenceKind = (typeof SCENARIO_REFERENCE_KINDS)[number];

/**
 * Defines the structured scenario map manifest contract for this module. Its declared surface makes map id,
 * scene key, actors, points, regions explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface ScenarioMapManifest {
  /**
   * stable map id used by {@link ScenarioMapManifest} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly mapId: ProbableWaffleMapEnum;
  /**
   * stable scene key used by {@link ScenarioMapManifest} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly sceneKey: string;
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly actors: readonly string[];
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly points: readonly string[];
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly regions: readonly string[];
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly routes: readonly string[];
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly groups: readonly string[];
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly cameraShots: readonly string[];
  /**
   * collection value on {@link ScenarioMapManifest}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly spawnSets: readonly string[];
}

/** Documents the validate mission scenario references member and its declared contract at this boundary. */
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
