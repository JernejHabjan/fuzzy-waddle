import { Subject } from "rxjs";
import type {
  CampaignMissionActionCancelReason,
  CampaignMissionActionContext,
  CampaignMissionActionResult,
  CampaignMissionConditionContext,
  CampaignWorldActionAdapter,
  CampaignWorldConditionAdapter,
  MissionActionDefinition,
  MissionActorSelector,
  MissionConditionDefinition,
  ScenarioActorId,
  ScenarioPointId,
  ScenarioRouteId
} from "@fuzzy-waddle/probable-waffle-campaign";
import {
  ConstructionStateEnum,
  OrderType,
  ProbableWaffleGameCommandTypes,
  ProbableWafflePlayerType,
  type CampaignMissionOwnedResourceRuntimeState,
  type CampaignMissionRuntimeJsonValue
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getActorComponent } from "../../data/actor-component";
import { emitResource, getPlayer } from "../../data/scene-data";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { AoeZoneManager } from "../../entity/systems/aoe-zone-manager";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SceneActorCreator } from "../../world/services/scene-actor-creator";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { IndexedScenarioReferenceRegistry } from "../scenario/scenario-reference-registry";
import { ScenarioActorReferenceComponent } from "../scenario/scenario-actor-reference.component";
import { CampaignOwnedResourceRegistry } from "./campaign-owned-resource-registry";
import { CampaignTrustedHookRegistry } from "./campaign-trusted-hook-registry";

export type CampaignPresentationRequest =
  | { readonly kind: "dialogue"; readonly id: string; readonly ownerToken: string }
  | { readonly kind: "cinematic"; readonly id: string; readonly ownerToken: string }
  | { readonly kind: "checkpoint"; readonly id: string; readonly ownerToken: string }
  | {
      readonly kind: "cancel";
      readonly presentationKind: "dialogue" | "cinematic";
      readonly id: string;
      readonly ownerToken: string;
      readonly reason: CampaignMissionActionCancelReason;
    };

/** The sole bridge from registry-driven campaign definitions into existing Phaser gameplay authorities. */
export class CampaignPhaserWorldAdapter implements CampaignWorldActionAdapter, CampaignWorldConditionAdapter {
  readonly presentationRequests$ = new Subject<CampaignPresentationRequest>();
  private readonly resources = new CampaignOwnedResourceRegistry();
  private readonly aoeZonesByEffectId = new Map<string, string>();
  private readonly contentAllowances = new Map<string, boolean>();
  private readonly temporaryModifiers = new Map<string, number>();
  private readonly pendingRestoredResources: CampaignMissionOwnedResourceRuntimeState[] = [];

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly trustedHooks = new CampaignTrustedHookRegistry()
  ) {}

  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    switch (definition.kind) {
      case "spawn-actor":
        return this.spawnActor(context, definition.actor, this.point(definition.pointId), definition.pointId);
      case "spawn-set":
        return this.spawnSet(context, definition);
      case "despawn-actor":
      case "destroy-building": {
        const actor = this.actor(definition.actorId);
        if (!actor) return missingReference(definition.actorId);
        const health = getActorComponent(actor, HealthComponent);
        if (health) health.destroyActorSilently();
        else actor.destroy();
        return completed();
      }
      case "convert-owner": {
        const actor = this.actor(definition.actorId);
        const owner = actor ? getActorComponent(actor, OwnerComponent) : undefined;
        if (!actor || !owner) return missingReference(definition.actorId);
        owner.setOwner(definition.ownerPlayerNumber);
        return completed();
      }
      case "assign-scenario-role": {
        const actor = getSceneService(this.scene, ActorIndexSystem)?.getActorById(definition.actorRuntimeId);
        const registry = this.scenarioRegistry;
        if (!actor || !registry) return missingReference(definition.actorRuntimeId);
        registry.claimActorRole(actor, definition.scenarioRoleId, definition.tags);
        return completed();
      }
      case "move-along-route":
        return this.moveAlongRoute(definition.actorId, definition.routeId, false);
      case "issue-order":
        return this.issueOrder(definition);
      case "teleport-actor": {
        const actor = this.actor(definition.actorId);
        const point = this.point(definition.pointId);
        const translate = actor ? getActorComponent(actor, ActorTranslateComponent) : undefined;
        if (!actor || !point || !translate) return missingReference(!actor ? definition.actorId : definition.pointId);
        translate.moveActorToLogicalPosition(point);
        return completed();
      }
      case "face-actor":
        return this.faceActor(definition);
      case "set-actor-flag":
        return this.setActorFlag(context, definition);
      case "revive-actor": {
        const actor = this.actor(definition.actorId);
        const health = actor ? getActorComponent(actor, HealthComponent) : undefined;
        if (!actor || !health) return missingReference(definition.actorId);
        health.resetHealth();
        health.resetArmor();
        actor.setActive(true);
        (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(true);
        return completed();
      }
      case "damage-actor": {
        const actor = this.actor(definition.actorId);
        const source = definition.sourceActorId ? this.actor(definition.sourceActorId) : undefined;
        const health = actor ? getActorComponent(actor, HealthComponent) : undefined;
        if (!actor || !health) return missingReference(definition.actorId);
        if (definition.sourceActorId && !source) return missingReference(definition.sourceActorId);
        health.takeDamage(definition.amount, definition.damageType, source);
        return completed();
      }
      case "heal-actor": {
        const actor = this.actor(definition.actorId);
        const health = actor ? getActorComponent(actor, HealthComponent) : undefined;
        if (!health) return missingReference(definition.actorId);
        health.heal(definition.amount);
        return completed();
      }
      case "begin-attack": {
        const actor = this.actor(definition.actorId);
        const target = this.actor(definition.targetActorId);
        const attack = actor ? getActorComponent(actor, AttackComponent) : undefined;
        if (!actor || !target || !attack) {
          return missingReference(!actor ? definition.actorId : definition.targetActorId);
        }
        attack.useAttack(target);
        return completed();
      }
      case "create-aoe":
        return this.createAoe(context, definition);
      case "remove-aoe":
        return this.removeAoe(context, definition.effectId);
      case "construct-building":
        return this.constructBuilding(context, definition);
      case "complete-construction": {
        const actor = this.actor(definition.actorId);
        const construction = actor ? getActorComponent(actor, ConstructionSiteComponent) : undefined;
        if (!construction) return missingReference(definition.actorId);
        construction.completeConstruction();
        return completed();
      }
      case "toggle-world-object":
        return this.toggleWorldObject(context, definition.actorId, definition.value);
      case "add-resource":
        emitResource(
          this.scene,
          "resource.added",
          { [definition.resourceType]: definition.amount },
          definition.playerNumber
        );
        return completed();
      case "remove-resource": {
        const player = getPlayer(this.scene, definition.playerNumber);
        if (!player || !player.canPayResources(definition.resourceType, definition.amount)) {
          return missingReference(`player-${definition.playerNumber}-${definition.resourceType}`);
        }
        emitResource(
          this.scene,
          "resource.removed",
          { [definition.resourceType]: definition.amount },
          definition.playerNumber
        );
        return completed();
      }
      case "transfer-resource":
        return this.transferResource(definition);
      case "grant-research": {
        if (!getPlayer(this.scene, definition.playerNumber)) {
          return missingReference(`player-${definition.playerNumber}`);
        }
        const techTree = getSceneService(this.scene, TechTreeService);
        if (!techTree) return executionFailed("Campaign research authority is unavailable");
        techTree.registerResearchComplete(definition.playerNumber, definition.researchType);
        return completed();
      }
      case "update-alliance":
        return this.updateAlliance(definition.playerNumber, definition.otherPlayerNumber, definition.allied);
      case "set-content-allowance":
        return this.setContentAllowance(context, definition);
      case "grant-temporary-modifier":
        return this.grantTemporaryModifier(context, definition);
      case "start-dialogue":
        return this.startPresentation(context, "dialogue", definition.lineId, definition.waitForAcknowledgement);
      case "start-cinematic":
        return this.startPresentation(context, "cinematic", definition.cinematicId, definition.waitForCompletion);
      case "create-checkpoint":
        this.presentationRequests$.next({
          kind: "checkpoint",
          id: definition.checkpointId,
          ownerToken: context.ownerToken
        });
        return completed();
      case "trusted-hook":
        return (
          this.trustedHooks.get(definition.hookId)?.execute(context) ?? {
            status: "failed",
            code: "execution-failed",
            message: `Trusted hook '${definition.hookId}' has no registered Phaser executor`
          }
        );
      default:
        return {
          status: "failed",
          code: "execution-failed",
          message: `Campaign world adapter cannot execute '${definition.kind}'`
        };
    }
  }

  resume(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult {
    if (!isRecord(continuationState)) return unresumable(definition.id);
    if (continuationState["retryMissingReference"] === true) return this.execute(context, definition);
    if (definition.kind === "move-along-route") {
      const actor = this.actor(definition.actorId);
      const route = this.scenarioRegistry?.route(definition.routeId);
      if (!actor || !route) return missingReference(!actor ? definition.actorId : definition.routeId);
      const finalPoint = route.points.at(-1);
      const position = getGameObjectLogicalTransform(actor);
      return finalPoint && position && samePosition(position, finalPoint)
        ? completed()
        : { status: "waiting", continuationState };
    }
    if (definition.kind === "start-dialogue" || definition.kind === "start-cinematic") {
      const completedInRuntime =
        definition.kind === "start-dialogue"
          ? context.state.dialoguePresentations[context.ownerToken]?.status === "acknowledged"
          : !!context.state.cinematics[definition.cinematicId]?.finalizeRequested;
      return completedInRuntime ? completed() : { status: "waiting", continuationState };
    }
    if (definition.kind === "trusted-hook") {
      return (
        this.trustedHooks.get(definition.hookId)?.resume?.(context, continuationState) ?? unresumable(definition.id)
      );
    }
    return unresumable(definition.id);
  }

  cancel(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void {
    if (definition.kind === "start-dialogue") {
      this.presentationRequests$.next({
        kind: "cancel",
        presentationKind: "dialogue",
        id: definition.lineId,
        ownerToken: context.ownerToken,
        reason
      });
    } else if (definition.kind === "start-cinematic") {
      this.presentationRequests$.next({
        kind: "cancel",
        presentationKind: "cinematic",
        id: definition.cinematicId,
        ownerToken: context.ownerToken,
        reason
      });
    } else if (definition.kind === "trusted-hook") {
      this.trustedHooks.get(definition.hookId)?.cancel?.(context, continuationState, reason);
    }
  }

  evaluate(_context: CampaignMissionConditionContext, definition: MissionConditionDefinition): boolean {
    switch (definition.kind) {
      case "actor-exists":
        return !!this.actor(definition.actorId);
      case "actor-alive": {
        const actor = this.actor(definition.actorId);
        return !!actor?.active && (getActorComponent(actor, HealthComponent)?.alive ?? true);
      }
      case "actor-owner":
        return this.ownerOf(definition.actorId) === definition.playerNumber;
      case "actor-type":
        return this.actor(definition.actorId)?.name === definition.actorType;
      case "actor-tag":
        return this.hasActorTag(definition.actorId, definition.tag);
      case "actor-health": {
        const actor = this.actor(definition.actorId);
        const health = actor ? getActorComponent(actor, HealthComponent) : undefined;
        if (!health) return false;
        const value = definition.percentage
          ? (health.healthComponentData.health / health.healthDefinition.maxHealth) * 100
          : health.healthComponentData.health;
        return compare(value, definition.comparison, definition.value);
      }
      case "actor-construction": {
        const actor = this.actor(definition.actorId);
        const construction = actor ? getActorComponent(actor, ConstructionSiteComponent) : undefined;
        if (!construction) return false;
        const state = construction.getData().state;
        const expected = {
          "not-started": ConstructionStateEnum.NotStarted,
          constructing: ConstructionStateEnum.Constructing,
          finished: ConstructionStateEnum.Finished
        }[definition.state];
        return state === expected;
      }
      case "actor-count":
      case "produced-count":
      case "building-count":
        return compare(this.selectActors(definition.selector).length, definition.comparison, definition.value);
      case "region-occupancy":
        return this.evaluateRegionOccupancy(definition);
      case "player-resource":
        return compare(
          getPlayer(this.scene, definition.playerNumber)?.getResources()[definition.resourceType] ?? 0,
          definition.comparison,
          definition.value
        );
      case "research":
        return !!getSceneService(this.scene, TechTreeService)?.isResearched(
          definition.playerNumber,
          definition.researchType
        );
      case "difficulty":
        return definition.values.includes(
          this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext?.difficulty ?? "normal"
        );
      case "player-count": {
        const players = this.scene.baseGameData.gameInstance.players.filter(
          (player) => !definition.connectedOnly || !player.playerController.data.leftOrKilled
        );
        return compare(players.length, definition.comparison, definition.value);
      }
      case "content-cap":
        return (
          (this.contentAllowances.get(
            allowanceKey(definition.playerNumber, definition.contentType, definition.contentId)
          ) ?? true) === definition.allowed
        );
      default:
        throw new Error(`Campaign world condition adapter cannot evaluate '${definition.kind}'`);
    }
  }

  requestObjectiveNarration(lineId: string, notificationId: string): void {
    this.presentationRequests$.next({
      kind: "dialogue",
      id: lineId,
      ownerToken: `mission:objective-narration:${notificationId}`
    });
  }

  restoreOwnedResources(resources: readonly CampaignMissionOwnedResourceRuntimeState[]): void {
    this.pendingRestoredResources.push(...resources);
  }

  /** Applies restored actor-owned state only after initial actors and stable references have been indexed. */
  activateRestoredResources(): void {
    for (const resource of this.pendingRestoredResources.sort((left, right) =>
      left.resourceId.localeCompare(right.resourceId)
    )) {
      this.restoreOwnedResource(resource);
    }
    this.pendingRestoredResources.length = 0;
  }

  resetOwnedResourcesForRestore(): void {
    this.resources.destroy();
    this.pendingRestoredResources.length = 0;
    this.aoeZonesByEffectId.clear();
    this.contentAllowances.clear();
    this.temporaryModifiers.clear();
  }

  releaseOwnedResources(
    ownerToken: string,
    resources: readonly CampaignMissionOwnedResourceRuntimeState[],
    reason: CampaignMissionActionCancelReason
  ): readonly string[] {
    return this.resources.release(
      ownerToken,
      resources.map((resource) => resource.resourceId),
      reason
    );
  }

  destroy(): void {
    this.resources.destroy();
    this.presentationRequests$.complete();
    this.aoeZonesByEffectId.clear();
    this.contentAllowances.clear();
    this.temporaryModifiers.clear();
  }

  private spawnActor(
    _context: CampaignMissionActionContext,
    actorDefinition: Extract<MissionActionDefinition, { readonly kind: "spawn-actor" }>["actor"],
    point: Vector3Simple | undefined,
    pointId: string
  ): CampaignMissionActionResult {
    if (!point) return missingReference(pointId);
    const actor = getSceneService(this.scene, SceneActorCreator)?.createFinishedActor(
      actorDefinition.actorName,
      point,
      actorDefinition.ownerPlayerNumber
    );
    if (!actor) return executionFailed(`Failed to spawn '${actorDefinition.actorName}'`);
    if (actorDefinition.scenarioRoleId) {
      this.scenarioRegistry?.claimActorRole(actor, actorDefinition.scenarioRoleId, actorDefinition.tags);
    }
    return completed();
  }

  private spawnSet(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "spawn-set" }>
  ): CampaignMissionActionResult {
    const set = this.scenarioRegistry?.spawnSet(definition.spawnSetId);
    if (!set) return missingReference(definition.spawnSetId);
    if (set.points.length !== definition.actors.length) {
      return executionFailed(
        `Spawn set '${definition.spawnSetId}' has ${set.points.length} points for ${definition.actors.length} actors`
      );
    }
    for (const [index, actor] of definition.actors.entries()) {
      const result = this.spawnActor(context, actor, set.points[index], `${definition.spawnSetId}[${index}]`);
      if (result.status === "failed") return result;
    }
    return completed();
  }

  private moveAlongRoute(actorId: ScenarioActorId, routeId: string, queue: boolean): CampaignMissionActionResult {
    const actor = this.actor(actorId);
    const route = this.scenarioRegistry?.route(routeId as ScenarioRouteId);
    if (!actor || !route) return missingReference(!actor ? actorId : routeId);
    const runtimeId = getActorComponent(actor, IdComponent)?.id;
    const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
    const commandBus = getSceneService(this.scene, CommandBusService);
    if (!runtimeId || owner === undefined || !commandBus) return executionFailed(`Actor '${actorId}' cannot move`);
    for (const [index, point] of route.points.entries()) {
      commandBus.dispatchDeterministic({
        type: ProbableWaffleGameCommandTypes.Move,
        playerNumber: owner,
        actorIds: [runtimeId],
        tileVec3: point,
        worldVec3: point,
        queue: queue || index > 0
      });
    }
    return route.points.length === 0
      ? completed()
      : {
          status: "waiting",
          continuationState: { actorId, routeId }
        };
  }

  private issueOrder(
    definition: Extract<MissionActionDefinition, { readonly kind: "issue-order" }>
  ): CampaignMissionActionResult {
    const actors = definition.actorIds.map((id) => this.actor(id));
    if (actors.some((actor) => !actor))
      return missingReference(definition.actorIds[actors.findIndex((actor) => !actor)]!);
    const runtimeIds = actors.map((actor) => getActorComponent(actor!, IdComponent)?.id).filter(Boolean) as string[];
    const owner = getActorComponent(actors[0]!, OwnerComponent)?.getOwner();
    const commandBus = getSceneService(this.scene, CommandBusService);
    if (owner === undefined || !commandBus || runtimeIds.length !== actors.length) {
      return executionFailed(`Campaign order '${definition.id}' has no command authority`);
    }
    if (definition.order === "stop") {
      commandBus.dispatchDeterministic({
        type: ProbableWaffleGameCommandTypes.Stop,
        playerNumber: owner,
        actorIds: runtimeIds
      });
      return completed();
    }
    const targetActor = definition.targetActorId ? this.actor(definition.targetActorId) : undefined;
    const targetPoint = definition.targetPointId ? this.point(definition.targetPointId) : undefined;
    if (definition.targetActorId && !targetActor) return missingReference(definition.targetActorId);
    if (definition.targetPointId && !targetPoint) return missingReference(definition.targetPointId);
    commandBus.dispatchDeterministic({
      type: ProbableWaffleGameCommandTypes.ActorAction,
      playerNumber: owner,
      actorIds: runtimeIds,
      orderType: definition.order === "attack" ? OrderType.Attack : OrderType.Move,
      targetObjectIds: targetActor ? [getActorComponent(targetActor, IdComponent)!.id] : undefined,
      tileVec3: targetPoint,
      queue: definition.queue ?? definition.order === "patrol"
    });
    return completed();
  }

  private faceActor(
    definition: Extract<MissionActionDefinition, { readonly kind: "face-actor" }>
  ): CampaignMissionActionResult {
    const actor = this.actor(definition.actorId);
    const translate = actor ? getActorComponent(actor, ActorTranslateComponent) : undefined;
    if (!actor || !translate) return missingReference(definition.actorId);
    const targetActor = definition.targetActorId ? this.actor(definition.targetActorId) : undefined;
    const targetPoint = definition.targetPointId ? this.point(definition.targetPointId) : undefined;
    if (definition.targetActorId && !targetActor) return missingReference(definition.targetActorId);
    if (definition.targetPointId && !targetPoint) return missingReference(definition.targetPointId);
    if (targetActor) translate.turnTowardsGameObject(targetActor);
    else if (targetPoint) translate.turnTowardsPosition(targetPoint);
    else if (definition.angle !== undefined) {
      const position = getGameObjectLogicalTransform(actor);
      if (position) {
        const radians = (definition.angle * Math.PI) / 180;
        translate.turnTowardsPosition({ x: position.x + Math.cos(radians), y: position.y + Math.sin(radians) });
      }
    }
    return completed();
  }

  private setActorFlag(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "set-actor-flag" }>
  ): CampaignMissionActionResult {
    const actor = this.actor(definition.actorId);
    if (!actor) return missingReference(definition.actorId);
    const key = `campaign.${definition.flag}`;
    const previous = actor.getData(key) ?? definition.flag !== "invulnerable";
    actor.setData(key, definition.value);
    const resourceId = `actor-flag:${definition.actorId}:${definition.flag}`;
    this.resources.register(context.ownerToken, resourceId, () => {
      if (actor.scene) actor.setData(key, previous);
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "actor-flag",
          state: { actorId: definition.actorId, flag: definition.flag, value: definition.value, previous }
        }
      ]
    };
  }

  private createAoe(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "create-aoe" }>
  ): CampaignMissionActionResult {
    const zoneId = this.instantiateAoe(definition);
    const manager = getSceneService(this.scene, AoeZoneManager);
    if (!zoneId || !manager) return missingReference(definition.pointId ?? definition.regionId ?? "aoe-position");
    this.aoeZonesByEffectId.set(definition.effectId, zoneId);
    const resourceId = `aoe:${definition.effectId}`;
    this.resources.register(context.ownerToken, resourceId, () => {
      manager.removeZone(zoneId);
      this.aoeZonesByEffectId.delete(definition.effectId);
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "aoe",
          state: { effectId: definition.effectId, definition: toRuntimeJsonValue(definition) }
        }
      ]
    };
  }

  private instantiateAoe(
    definition: Extract<MissionActionDefinition, { readonly kind: "create-aoe" }>
  ): string | undefined {
    const position = definition.pointId
      ? this.point(definition.pointId)
      : definition.regionId
        ? this.scenarioRegistry?.debugFocus(definition.regionId)
        : undefined;
    const manager = getSceneService(this.scene, AoeZoneManager);
    if (!position || !manager) return undefined;
    return manager.createZone({
      spellType: definition.spellType,
      worldPosition: position,
      radius: definition.radiusTiles,
      duration: definition.durationTicks * SimulationTickService.TICK_INTERVAL_MS,
      tickInterval: definition.tickIntervalTicks * SimulationTickService.TICK_INTERVAL_MS,
      effectWhileInside: definition.effectWhileInside,
      affectsAllies: definition.affectsAllies,
      affectsEnemies: definition.affectsEnemies,
      sourcePlayerId: definition.sourcePlayerNumber
    });
  }

  private removeAoe(context: CampaignMissionActionContext, effectId: string): CampaignMissionActionResult {
    const resourceId = `aoe:${effectId}`;
    const resource = context.state.ownedResources[resourceId];
    if (!resource || !this.aoeZonesByEffectId.has(effectId)) return missingReference(effectId);
    const leaked = this.resources.release(resource.ownerToken, [resourceId], "action-removed");
    delete context.state.ownedResources[resourceId];
    if (leaked.length > 0) {
      return { status: "failed", code: "resource-leak", message: `AOE '${effectId}' failed cleanup` };
    }
    return completed();
  }

  private constructBuilding(
    _context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "construct-building" }>
  ): CampaignMissionActionResult {
    const point = this.point(definition.pointId);
    const creator = getSceneService(this.scene, SceneActorCreator);
    if (!point || !creator) return missingReference(definition.pointId);
    const actor = creator.createActorFromDefinition({
      name: definition.actor.actorName,
      owner: { ownerId: definition.actor.ownerPlayerNumber },
      representable: { logicalWorldTransform: point },
      constructionSite: { state: ConstructionStateEnum.NotStarted }
    });
    if (!actor) return executionFailed(`Failed to construct '${definition.actor.actorName}'`);
    if (definition.actor.scenarioRoleId) {
      this.scenarioRegistry?.claimActorRole(actor, definition.actor.scenarioRoleId, definition.actor.tags);
    }
    return completed();
  }

  private toggleWorldObject(
    context: CampaignMissionActionContext,
    actorId: ScenarioActorId,
    value: boolean
  ): CampaignMissionActionResult {
    const actor = this.actor(actorId);
    if (!actor) return missingReference(actorId);
    const visible = (actor as unknown as Phaser.GameObjects.Components.Visible).visible;
    const active = actor.active;
    actor.setActive(value);
    (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(value);
    const resourceId = `world-object:${actorId}`;
    this.resources.register(context.ownerToken, resourceId, () => {
      if (!actor.scene) return;
      actor.setActive(active);
      (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(visible);
    });
    return {
      status: "completed",
      ownedResources: [{ resourceId, kind: "world-object", state: { actorId, value, active, visible } }]
    };
  }

  private transferResource(
    definition: Extract<MissionActionDefinition, { readonly kind: "transfer-resource" }>
  ): CampaignMissionActionResult {
    const from = getPlayer(this.scene, definition.fromPlayerNumber);
    const to = getPlayer(this.scene, definition.toPlayerNumber);
    if (!from || !to || !from.canPayResources(definition.resourceType, definition.amount)) {
      return missingReference(`resource-transfer-${definition.fromPlayerNumber}-${definition.toPlayerNumber}`);
    }
    emitResource(
      this.scene,
      "resource.removed",
      { [definition.resourceType]: definition.amount },
      definition.fromPlayerNumber
    );
    emitResource(
      this.scene,
      "resource.added",
      { [definition.resourceType]: definition.amount },
      definition.toPlayerNumber
    );
    return completed();
  }

  private updateAlliance(
    playerNumber: number,
    otherPlayerNumber: number,
    allied: boolean
  ): CampaignMissionActionResult {
    const player = getPlayer(this.scene, playerNumber);
    const other = getPlayer(this.scene, otherPlayerNumber);
    const playerDefinition = player?.playerController.data.playerDefinition;
    const otherDefinition = other?.playerController.data.playerDefinition;
    if (!playerDefinition || !otherDefinition) return missingReference(`players-${playerNumber}-${otherPlayerNumber}`);
    if (allied) {
      const team = playerDefinition.team ?? otherDefinition.team ?? Math.min(playerNumber, otherPlayerNumber);
      playerDefinition.team = team;
      otherDefinition.team = team;
    } else if (playerDefinition.team === otherDefinition.team) {
      otherDefinition.team = otherPlayerNumber;
    }
    return completed();
  }

  private setContentAllowance(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "set-content-allowance" }>
  ): CampaignMissionActionResult {
    const key = allowanceKey(definition.playerNumber, definition.contentType, definition.contentId);
    const previous = this.contentAllowances.get(key) ?? true;
    this.contentAllowances.set(key, definition.allowed);
    const resourceId = `content-allowance:${key}`;
    this.resources.register(context.ownerToken, resourceId, () => this.contentAllowances.set(key, previous));
    return {
      status: "completed",
      ownedResources: [{ resourceId, kind: "content-allowance", state: { key, value: definition.allowed, previous } }]
    };
  }

  private grantTemporaryModifier(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "grant-temporary-modifier" }>
  ): CampaignMissionActionResult {
    const key = `${definition.modifierId}:${definition.playerNumber ?? "none"}:${definition.actorId ?? "none"}`;
    const previous = this.temporaryModifiers.get(key);
    this.temporaryModifiers.set(key, definition.value);
    const resourceId = `modifier:${key}`;
    this.resources.register(context.ownerToken, resourceId, () => {
      if (previous === undefined) this.temporaryModifiers.delete(key);
      else this.temporaryModifiers.set(key, previous);
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "temporary-modifier",
          state: { key, value: definition.value, previous: previous ?? null }
        }
      ]
    };
  }

  private startPresentation(
    context: CampaignMissionActionContext,
    kind: "dialogue" | "cinematic",
    id: string,
    wait: boolean | undefined
  ): CampaignMissionActionResult {
    this.presentationRequests$.next({ kind, id, ownerToken: context.ownerToken });
    return wait ? { status: "waiting", continuationState: { presentationKind: kind, id } } : completed();
  }

  private evaluateRegionOccupancy(
    definition: Extract<MissionConditionDefinition, { readonly kind: "region-occupancy" }>
  ): boolean {
    const region = this.scenarioRegistry?.region(definition.regionId);
    if (!region) return false;
    const selected = this.selectActors(definition.selector ?? {});
    const occupants = selected.filter((actor) => {
      const position = getGameObjectLogicalTransform(actor);
      return !!position && region.contains(position);
    });
    switch (definition.policy.kind) {
      case "any":
        return occupants.length > 0;
      case "specific-player": {
        const playerNumber = definition.policy.playerNumber;
        return occupants.some((actor) => getActorComponent(actor, OwnerComponent)?.getOwner() === playerNumber);
      }
      case "specific-faction": {
        const faction = definition.policy.faction;
        return occupants.some((actor) => {
          const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
          return owner !== undefined && playerFaction(this.scene, owner) === faction;
        });
      }
      case "all-connected-players": {
        const requiredPlayers = this.scene.baseGameData.gameInstance.players
          .filter(
            (player) =>
              !player.playerController.data.leftOrKilled &&
              player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
          )
          .map((player) => player.playerNumber)
          .filter((playerNumber): playerNumber is number => playerNumber !== undefined);
        const occupyingPlayers = new Set(
          occupants.map((actor) => getActorComponent(actor, OwnerComponent)?.getOwner()).filter(Boolean)
        );
        return requiredPlayers.every((playerNumber) => occupyingPlayers.has(playerNumber));
      }
      case "at-least":
        return occupants.length >= definition.policy.count;
      case "entire-group": {
        const group = this.scenarioRegistry?.group(definition.policy.groupId) ?? [];
        return group.length > 0 && group.every((actor) => occupants.includes(actor));
      }
    }
  }

  private selectActors(selector: MissionActorSelector): Phaser.GameObjects.GameObject[] {
    let actors: readonly Phaser.GameObjects.GameObject[] = this.scenarioRegistry?.allActors() ?? [];
    if (selector.actorIds) actors = selector.actorIds.flatMap((id) => this.actor(id) ?? []);
    if (selector.groupId) actors = this.scenarioRegistry?.group(selector.groupId) ?? [];
    if (selector.tag) actors = this.scenarioRegistry?.actorsWithTag(selector.tag) ?? [];
    return [...actors]
      .filter(
        (actor) =>
          selector.ownerPlayerNumber === undefined ||
          getActorComponent(actor, OwnerComponent)?.getOwner() === selector.ownerPlayerNumber
      )
      .filter((actor) => selector.actorType === undefined || actor.name === selector.actorType)
      .filter(
        (actor) =>
          selector.alive === undefined ||
          (!!actor.active && (getActorComponent(actor, HealthComponent)?.alive ?? true)) === selector.alive
      );
  }

  private restoreOwnedResource(resource: CampaignMissionOwnedResourceRuntimeState): void {
    if (!isRecord(resource.state)) return;
    if (resource.kind === "actor-flag") {
      const actorId = resource.state["actorId"];
      const flag = resource.state["flag"];
      const value = resource.state["value"];
      const previous = resource.state["previous"];
      if (
        typeof actorId !== "string" ||
        typeof flag !== "string" ||
        typeof value !== "boolean" ||
        typeof previous !== "boolean"
      )
        return;
      const actor = this.actor(actorId as ScenarioActorId);
      if (!actor) return;
      const key = `campaign.${flag}`;
      actor.setData(key, value);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        if (actor.scene) actor.setData(key, previous);
      });
    } else if (resource.kind === "world-object") {
      const actorId = resource.state["actorId"];
      const value = resource.state["value"];
      const active = resource.state["active"];
      const visible = resource.state["visible"];
      if (
        typeof actorId !== "string" ||
        typeof value !== "boolean" ||
        typeof active !== "boolean" ||
        typeof visible !== "boolean"
      )
        return;
      const actor = this.actor(actorId as ScenarioActorId);
      if (!actor) return;
      actor.setActive(value);
      (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(value);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        if (!actor.scene) return;
        actor.setActive(active);
        (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(visible);
      });
    } else if (resource.kind === "aoe") {
      const effectId = resource.state["effectId"];
      const definitionState = resource.state["definition"];
      if (typeof effectId !== "string" || !isRecord(definitionState) || definitionState["kind"] !== "create-aoe")
        return;
      const zoneId = this.instantiateAoe(
        definitionState as unknown as Extract<MissionActionDefinition, { readonly kind: "create-aoe" }>
      );
      if (!zoneId) return;
      this.aoeZonesByEffectId.set(effectId, zoneId);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        getSceneService(this.scene, AoeZoneManager)?.removeZone(zoneId);
        this.aoeZonesByEffectId.delete(effectId);
      });
    } else if (resource.kind === "content-allowance") {
      const key = resource.state["key"];
      const value = resource.state["value"];
      const previous = resource.state["previous"];
      if (typeof key !== "string" || typeof value !== "boolean" || typeof previous !== "boolean") return;
      this.contentAllowances.set(key, value);
      this.resources.register(resource.ownerToken, resource.resourceId, () =>
        this.contentAllowances.set(key, previous)
      );
    } else if (resource.kind === "temporary-modifier") {
      const key = resource.state["key"];
      const value = resource.state["value"];
      const previous = resource.state["previous"];
      if (typeof key !== "string" || typeof value !== "number") return;
      this.temporaryModifiers.set(key, value);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        if (typeof previous === "number") this.temporaryModifiers.set(key, previous);
        else this.temporaryModifiers.delete(key);
      });
    }
  }

  private actor(id: ScenarioActorId): Phaser.GameObjects.GameObject | undefined {
    return this.scenarioRegistry?.actor(id);
  }

  private ownerOf(id: ScenarioActorId): number | undefined {
    const actor = this.actor(id);
    return actor ? getActorComponent(actor, OwnerComponent)?.getOwner() : undefined;
  }

  private hasActorTag(id: ScenarioActorId, tag: string): boolean {
    const actor = this.actor(id);
    return !!actor && !!getActorComponent(actor, ScenarioActorReferenceComponent)?.hasTag(tag);
  }

  private point(id: string): Vector3Simple | undefined {
    return this.scenarioRegistry?.point(id as ScenarioPointId);
  }

  private get scenarioRegistry(): IndexedScenarioReferenceRegistry | undefined {
    return getSceneService(this.scene, IndexedScenarioReferenceRegistry);
  }
}

function completed(): CampaignMissionActionResult {
  return { status: "completed" };
}

function missingReference(id: string): CampaignMissionActionResult {
  return {
    status: "failed",
    code: "missing-reference",
    message: `Campaign action reference '${id}' is missing`,
    continuationState: { retryMissingReference: true, referenceId: id }
  };
}

function executionFailed(message: string): CampaignMissionActionResult {
  return { status: "failed", code: "execution-failed", message };
}

function unresumable(actionId: string): CampaignMissionActionResult {
  return { status: "failed", code: "unresumable", message: `Campaign action '${actionId}' cannot resume` };
}

function isRecord(
  value: CampaignMissionRuntimeJsonValue | undefined
): value is { readonly [key: string]: CampaignMissionRuntimeJsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function samePosition(left: Vector3Simple, right: Vector3Simple): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}

function compare(left: number, comparison: string, right: number): boolean {
  switch (comparison) {
    case "equal":
      return left === right;
    case "not-equal":
      return left !== right;
    case "less":
      return left < right;
    case "less-or-equal":
      return left <= right;
    case "greater":
      return left > right;
    case "greater-or-equal":
      return left >= right;
    default:
      return false;
  }
}

function allowanceKey(playerNumber: number, contentType: string, contentId: string): string {
  return `${playerNumber}:${contentType}:${contentId}`;
}

function playerFaction(scene: ProbableWaffleScene, playerNumber: number): "tivara" | "skaduwee" | undefined {
  const faction = getPlayer(scene, playerNumber)?.factionType;
  return faction === 1 ? "tivara" : faction === 2 ? "skaduwee" : undefined;
}

function toRuntimeJsonValue(value: unknown): CampaignMissionRuntimeJsonValue {
  return JSON.parse(JSON.stringify(value)) as CampaignMissionRuntimeJsonValue;
}
