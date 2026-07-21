import type {
  ScenarioActorId,
  ScenarioCameraShotId,
  ScenarioGroupId,
  ScenarioPointId,
  ScenarioRegionId,
  ScenarioRouteId,
  ScenarioSpawnSetId
} from "./campaign-content-id";

/** Required authored references for a mission's configured Phaser map scene. */
export interface MissionScenarioReferences {
  readonly actors?: readonly ScenarioActorId[];
  readonly points?: readonly ScenarioPointId[];
  readonly regions?: readonly ScenarioRegionId[];
  readonly routes?: readonly ScenarioRouteId[];
  readonly groups?: readonly ScenarioGroupId[];
  readonly cameraShots?: readonly ScenarioCameraShotId[];
  readonly spawnSets?: readonly ScenarioSpawnSetId[];
}
