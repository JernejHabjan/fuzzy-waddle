import Phaser from "phaser";
import {
  ProbableWaffleGameCommandTypes,
  type ConcedeCommand,
  type ConstructCommand,
  ConstructionStateEnum
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { Subscription } from "rxjs";
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

/**
 * Applies scene-level command effects that cannot be owned by one existing actor
 * system. Actor-local move/action/queue/spell/unload commands remain with their
 * components but report through the same command bus outcome channel.
 */
export class SharedCommandApplicationService {
  private commandSubscription?: Subscription;
  private readonly appliedSiteKeys = new Map<string, string>();
  private readonly siteCompletionSubscriptions: Subscription[] = [];

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly concedePlayer: (playerNumber: number) => boolean
  ) {
    const commandBus = getSceneService(scene, CommandBusService);
    if (!commandBus) throw new Error("SharedCommandApplicationService requires CommandBusService");
    this.commandSubscription = commandBus.command$.subscribe((command) => {
      if (command.type === ProbableWaffleGameCommandTypes.Construct) this.applyConstruct(command);
      if (command.type === ProbableWaffleGameCommandTypes.Concede) this.applyConcede(command);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private applyConstruct(command: ConstructCommand): void {
    const commandBus = getSceneService(this.scene, CommandBusService)!;
    const existingSiteId = this.appliedSiteKeys.get(command.siteKey);
    if (existingSiteId) {
      commandBus.reportOutcome(command, "completed", "applied", command.actorIds, [existingSiteId], "site_reconciled");
      return;
    }

    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    const builders = command.actorIds
      .map((actorId) => actorIndex?.getActorById(actorId))
      .filter((actor): actor is Phaser.GameObjects.GameObject => actor !== undefined);
    if (builders.length !== command.actorIds.length) {
      commandBus.reportOutcome(command, "rejected", "missing_actor");
      return;
    }
    if (
      builders.some(
        (builder) => getActorComponent(builder, OwnerComponent)?.getOwner() !== command.playerNumber
      )
    ) {
      commandBus.reportOutcome(command, "rejected", "invalid_owner");
      return;
    }
    if (builders.some((builder) => !builder.active || getActorComponent(builder, HealthComponent)?.killed === true)) {
      commandBus.reportOutcome(command, "rejected", "inactive_actor");
      return;
    }
    if (
      builders.some(
        (builder) =>
          !getActorComponent(builder, BuilderComponent)?.constructableBuildings.includes(command.actorName)
      )
    ) {
      commandBus.reportOutcome(command, "rejected", "unsupported_action");
      return;
    }
    const player = getPlayer(this.scene, command.playerNumber);
    const costs = getCostForObjectName(command.actorName);
    if (!player || !costs || !player.canPayAllResources(costs)) {
      commandBus.reportOutcome(command, "rejected", "insufficient_resources");
      return;
    }
    const productionEligibility = ProductionValidator.validateObject(
      this.scene,
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

    const world = IsoHelper.isometricTileToWorldXY(this.scene, command.tileVec3.x, command.tileVec3.y);
    let site: Phaser.GameObjects.GameObject;
    try {
      site = BuildingCursor.spawnBuildingForPlayer(
        this.scene,
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
      commandBus.reportOutcome(command, "failed", "unsupported_action", command.actorIds, [], "missing_construction_site");
      return;
    }
    const tilemap = getSceneComponent(this.scene, TilemapComponent)?.tilemap;
    const navigation = getSceneService(this.scene, NavigationService);
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
    if (
      footprint.length === 0 ||
      !navigation ||
      footprint.some((tile) => !navigation.isTileGridWithoutBlockingObjectsNavigable(tile)) ||
      hasCollision
    ) {
      site.destroy();
      commandBus.reportOutcome(command, "rejected", "illegal_site", command.actorIds, [], "invalid_footprint");
      return;
    }

    this.appliedSiteKeys.set(command.siteKey, siteId);
    let assignedBuilderCount = 0;
    for (const builder of builders) {
      if (getActorSystem(builder, ActionSystem)?.executeAction(OrderType.Build, site, undefined, false)) {
        assignedBuilderCount += 1;
      }
    }
    if (assignedBuilderCount !== builders.length) {
      this.appliedSiteKeys.delete(command.siteKey);
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
    this.siteCompletionSubscriptions.push(completionSubscription);
    site.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.appliedSiteKeys.get(command.siteKey) === siteId) this.appliedSiteKeys.delete(command.siteKey);
      if (settled) return;
      settled = true;
      completionSubscription.unsubscribe();
      if (this.scene.sys.isActive()) {
        commandBus.reportOutcome(command, "failed", "application_failed", command.actorIds, [siteId], "site_destroyed");
      }
    });
  }

  private applyConcede(command: ConcedeCommand): void {
    const commandBus = getSceneService(this.scene, CommandBusService)!;
    if (!this.concedePlayer(command.playerNumber)) {
      commandBus.reportOutcome(command, "rejected", "application_failed", [], [], "mode_rejected_concession");
      return;
    }
    commandBus.reportOutcome(command, "completed", "applied", [], [], command.reason);
  }

  private destroy(): void {
    this.commandSubscription?.unsubscribe();
    this.siteCompletionSubscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
