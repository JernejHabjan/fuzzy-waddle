import Phaser from "phaser";
import {
  type ConstructCommand,
  ConstructionStateEnum
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { Subscription } from "rxjs";
import { emitConstructionPlacement } from "./emit-construction-placement";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getActorSystem } from "../../../data/actor-system";
import { getPlayer } from "../../../data/scene-data";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ActionSystem } from "../../../entity/systems/action.system";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { OrderType } from "../../../ai/order-type";
import { BuildingCursor } from "../../../player/human-controller/building-cursor";
import { IsoHelper } from "../../tilemap/iso-helper";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { getCostForObjectName } from "../../../entity/components/production/cost-utils";
import { getSceneComponent, getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "./command-bus.service";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { ProductionValidator } from "../../../data/tech-tree/production-validator";
import { NavigationService } from "../navigation.service";
import { TilemapComponent } from "../../tilemap/tilemap.component";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";

/** Applies the shared native construction checks and lifecycle; placement observation adds no route query. */
export function applySharedConstructionCommand(
  scene: ProbableWaffleScene, command: ConstructCommand, appliedSiteKeys: Map<string, string>,
  siteCompletionSubscriptions: Subscription[]
): void {
  const commandBus = getSceneService(scene, CommandBusService)!;
  const existingSiteId = appliedSiteKeys.get(command.siteKey);
  if (existingSiteId) {
    commandBus.reportOutcome(command, "completed", "applied", command.actorIds, [existingSiteId], "site_reconciled");
    return;
  }

  const actorIndex = getSceneService(scene, ActorIndexSystem);
  const builders = command.actorIds
    .map((actorId) => actorIndex?.getActorById(actorId))
    .filter((actor): actor is Phaser.GameObjects.GameObject => actor !== undefined);
  if (builders.length !== command.actorIds.length) {
    commandBus.reportOutcome(command, "rejected", "missing_actor");
    return;
  }
  if (builders.some((builder) => getActorComponent(builder, OwnerComponent)?.getOwner() !== command.playerNumber)) {
    commandBus.reportOutcome(command, "rejected", "invalid_owner");
    return;
  }
  if (builders.some((builder) => !builder.active || getActorComponent(builder, HealthComponent)?.killed === true)) {
    commandBus.reportOutcome(command, "rejected", "inactive_actor");
    return;
  }
  if (
    builders.some(
      (builder) => !getActorComponent(builder, BuilderComponent)?.constructableBuildings.includes(command.actorName)
    )
  ) {
    commandBus.reportOutcome(command, "rejected", "unsupported_action");
    return;
  }
  const player = getPlayer(scene, command.playerNumber);
  const costs = getCostForObjectName(command.actorName);
  if (!player || !costs || !player.canPayAllResources(costs)) {
    commandBus.reportOutcome(command, "rejected", "insufficient_resources");
    return;
  }
  const productionEligibility = ProductionValidator.validateObject(
    scene,
    command.playerNumber,
    command.actorName
  );
  if (!productionEligibility.canQueue) {
    commandBus.reportOutcome(
      command,
      "rejected",
      productionEligibility.prereqs.resources ? "insufficient_resources" : "unsupported_action",
      command.actorIds,
      [],
      "construction_prerequisites_not_met"
    );
    return;
  }

  const world = IsoHelper.isometricTileToWorldXY(scene, command.tileVec3.x, command.tileVec3.y);
  let site: Phaser.GameObjects.GameObject;
  try {
    site = BuildingCursor.spawnBuildingForPlayer(
      scene,
      command.actorName,
      { x: world.x, y: world.y, z: command.tileVec3.z },
      command.playerNumber
    );
  } catch {
    commandBus.reportOutcome(command, "failed", "application_failed", command.actorIds, [], "site_spawn_failed");
    return;
  }
  const siteId = getActorComponent(site, IdComponent)?.id;
  if (!siteId) {
    site.destroy();
    commandBus.reportOutcome(command, "failed", "application_failed", command.actorIds, [], "site_missing_id");
    return;
  }

  const constructionSite = getActorComponent(site, ConstructionSiteComponent);
  if (!constructionSite) {
    site.destroy();
    commandBus.reportOutcome(
      command,
      "failed",
      "unsupported_action",
      command.actorIds,
      [],
      "missing_construction_site"
    );
    return;
  }
  const tilemap = getSceneComponent(scene, TilemapComponent)?.tilemap;
  const navigation = getSceneService(scene, NavigationService);
  const footprint = tilemap ? getTileCoordsUnderObject(tilemap, site) : [];
  const builderSet = new Set(builders);
  const hasCollision = actorIndex
    ?.getAllIdActors()
    .some(
      (actor) =>
        actor !== site &&
        !builderSet.has(actor) &&
        tilemap !== undefined &&
        getTileCoordsUnderObject(tilemap, actor).some((actorTile) =>
          footprint.some((siteTile) => actorTile.x === siteTile.x && actorTile.y === siteTile.y)
        )
    );
  const illegal =
    footprint.length === 0 ||
    !navigation ||
    footprint.some((tile) => !navigation.isTileGridWithoutBlockingObjectsNavigable(tile)) ||
    hasCollision;
  emitConstructionPlacement(scene, command, site, footprint, !illegal);
  if (illegal) {
    site.destroy();
    commandBus.reportOutcome(command, "rejected", "illegal_site", command.actorIds, [], "invalid_footprint");
    return;
  }

  appliedSiteKeys.set(command.siteKey, siteId);
  let assignedBuilderCount = 0;
  if (!constructionSite.buildsWithoutAssignedWorkers) {
    for (const builder of builders) {
      if (getActorSystem(builder, ActionSystem)?.executeAction(OrderType.Build, site, undefined, false)) {
        assignedBuilderCount += 1;
      }
    }
  }
  if (!constructionSite.buildsWithoutAssignedWorkers && assignedBuilderCount !== builders.length) {
    appliedSiteKeys.delete(command.siteKey);
    site.destroy();
    commandBus.reportOutcome(
      command,
      "failed",
      "application_failed",
      command.actorIds,
      [],
      `builder_assignment_failed:${assignedBuilderCount}/${builders.length}`
    );
    return;
  }
  commandBus.reportOutcome(command, "applied", "applied", command.actorIds, [siteId], command.siteKey);
  commandBus.reportOutcome(command, "active", "applied", command.actorIds, [siteId], "construction_started");
  let settled = false;
  const completionSubscription = constructionSite.constructionStateChanged.subscribe((state) => {
    if (settled || state !== ConstructionStateEnum.Finished) return;
    settled = true;
    commandBus.reportOutcome(command, "completed", "applied", command.actorIds, [siteId], "construction_finished");
    completionSubscription.unsubscribe();
  });
  siteCompletionSubscriptions.push(completionSubscription);
  site.once(Phaser.GameObjects.Events.DESTROY, () => {
    if (appliedSiteKeys.get(command.siteKey) === siteId) appliedSiteKeys.delete(command.siteKey);
    if (settled) return;
    settled = true;
    completionSubscription.unsubscribe();
    if (scene.sys.isActive()) {
      commandBus.reportOutcome(command, "failed", "application_failed", command.actorIds, [siteId], "site_destroyed");
    }
  });
}
