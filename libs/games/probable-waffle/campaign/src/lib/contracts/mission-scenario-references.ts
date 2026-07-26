import type {
  ScenarioActorId,
  ScenarioCameraShotId,
  ScenarioGroupId,
  ScenarioPointId,
  ScenarioRegionId,
  ScenarioRouteId,
  ScenarioSpawnSetId
} from "./campaign-content-id";

/** Defines the mission scenario references contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface MissionScenarioReferences {
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly actors?: readonly ScenarioActorId[];
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly points?: readonly ScenarioPointId[];
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly regions?: readonly ScenarioRegionId[];
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly routes?: readonly ScenarioRouteId[];
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly groups?: readonly ScenarioGroupId[];
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly cameraShots?: readonly ScenarioCameraShotId[];
  /**
   * Optional collection value on {@link MissionScenarioReferences}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly spawnSets?: readonly ScenarioSpawnSetId[];
}
