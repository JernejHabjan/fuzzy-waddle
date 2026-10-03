import type Phaser from "phaser";
import type { OwnerComponent } from "../owner-component";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import type { ProductionQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/game-object";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SceneActorCreator } from "../../../world/services/scene-actor-creator";
import { getGameObjectBounds, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import RallyPoint from "../../../prefabs/buildings/misc/RallyPoint";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { NavigationService } from "../../../world/services/navigation.service";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";
import { OrderType } from "../../../ai/order-type";
import { getActorSystem } from "../../../data/actor-system";
import { ActionSystem } from "../../systems/action.system";

/** Resolve a legal spawn and apply the existing rally action; the caller remains the queue owner. */
export async function spawnProductionActor(
  gameObject: Phaser.GameObjects.GameObject,
  item: ProductionQueueItem,
  rallyPoint: RallyPoint,
  navigationService: NavigationService,
  ownerComponent: OwnerComponent | undefined
): Promise<string | null> {
  const { actorName } = item;

  const logicalTransform = getGameObjectLogicalTransform(gameObject);
  if (!logicalTransform) throw new Error("Transform not found");

  // offset spawn position
  const bounds = getGameObjectBounds(gameObject);
  if (!bounds) throw new Error("Bounds not found");
  const { width, height } = bounds;

  // Get NavigationService to find a valid spawn location
  let finalSpawnPosition = {
    x: logicalTransform.x + width / 2,
    y: logicalTransform.y + height / 4,
    z: logicalTransform.z
  } satisfies Vector3Simple;
  let validSpawnLocationFound = false;

  // Determine target tile preference based on rally point if it's set
  let targetTile: Vector3Simple | undefined;
  if (rallyPoint.isSet()) {
    targetTile = rallyPoint.getTargetTileVec3();
  }

  const unitDef = getPwActorDefinition(actorName, null);
  const isWaterUnit = unitDef?.components?.translatable?.movementTerrainType === MovementTerrainType.Water;

  let spawnTile: { x: number; y: number } | null | undefined;
  if (isWaterUnit) {
    const buildingTile = navigationService.getCenterTileCoordUnderObject(gameObject);
    if (buildingTile) {
      spawnTile = navigationService.findNearestWaterTile(buildingTile);
    }
  } else {
    spawnTile = navigationService.getSpawnPointAroundGameObject(gameObject, undefined, targetTile);
  }

  if (spawnTile) {
    const unoccupiedWorldPosition = IsoHelper.isometricTileToWorldXY(
      gameObject.scene,
      spawnTile.x,
      spawnTile.y
    )!;
    finalSpawnPosition = {
      x: unoccupiedWorldPosition.x,
      y: unoccupiedWorldPosition.y,
      z: finalSpawnPosition.z
    } satisfies Vector3Simple;
    validSpawnLocationFound = true;
  }

  // A missing legal spawn is reported as a failed completion by the queue owner.
  if (!validSpawnLocationFound) {
    return null;
  }

  // Spawn gameObject using helper
  const originalOwner = ownerComponent?.getOwner();

  const sceneActorCreator = getSceneService(gameObject.scene, SceneActorCreator);
  if (!sceneActorCreator) throw new Error("SceneActorCreator not found");

  const newGameObject = sceneActorCreator.createFinishedActor(actorName, finalSpawnPosition, originalOwner);
  if (newGameObject) {
    if (originalOwner !== undefined) {
      gameObject.scene.events.emit(ProbableWaffleSceneEventName.ScoreUnitProduced, originalOwner);
    }
    if (rallyPoint.isSet()) {
      executeSpawnRallyAction(newGameObject, rallyPoint);
    }
  }
  return newGameObject ? (getActorComponent(newGameObject, IdComponent)?.id ?? null) : null;
}

function executeSpawnRallyAction(newGameObject: Phaser.GameObjects.GameObject, rallyPoint: RallyPoint) {
  const actionSystem = getActorSystem<ActionSystem>(newGameObject, ActionSystem);
  if (!actionSystem) {
    // noinspection JSIgnoredPromiseFromCall
    rallyPoint.navigateGameObjectToRallyPoint(newGameObject);
    return;
  }

  const targetGameObject = rallyPoint.getTargetGameObject();
  if (targetGameObject?.active) {
    actionSystem.executeAction(undefined, targetGameObject);
    return;
  }

  const targetTile = rallyPoint.getTargetTileVec3();
  if (targetTile) {
    actionSystem.executeAction(OrderType.Move, undefined, targetTile);
  }
}
