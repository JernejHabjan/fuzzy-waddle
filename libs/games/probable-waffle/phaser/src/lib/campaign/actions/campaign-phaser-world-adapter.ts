import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  CampaignContentAllowanceService,
  updateCampaignParticipantTeams,
  type CampaignAllowedContentId,
  type CampaignEncounterSpawnResult,
  type CampaignEncounterWorldAdapter,
  type CampaignMissionActionCancelReason,
  type CampaignMissionActionContext,
  type CampaignMissionActionResult,
  type CampaignMissionConditionContext,
  type CampaignTemporaryContentGrant,
  type CampaignWorldActionAdapter,
  type CampaignWorldConditionAdapter,
  type MissionActionDefinition,
  type MissionActorSelector,
  type MissionConditionDefinition,
  type MissionEncounterSpawnGroupDefinition,
  type ScenarioActorId,
  type ScenarioPointId,
  type ScenarioRouteId
} from "@fuzzy-waddle/probable-waffle-campaign";
import {
  ConstructionStateEnum,
  OrderType,
  ProbableWaffleGameCommandTypes,
  ProbableWafflePlayerType,
  type CampaignMissionOwnedResourceRuntimeState,
  type CampaignMissionRuntimeJsonValue,
  type PositionPlayerDefinition
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
import { getSceneService, getSceneSystem } from "../../world/services/scene-component-helpers";
import { SceneActorCreator } from "../../world/services/scene-actor-creator";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { IndexedScenarioReferenceRegistry } from "../scenario/scenario-reference-registry";
import { ScenarioActorReferenceComponent } from "../scenario/scenario-actor-reference.component";
import { CampaignOwnedResourceRegistry } from "./campaign-owned-resource-registry";
import { CampaignTrustedHookRegistry } from "./campaign-trusted-hook-registry";
import { AiPlayerHandler } from "../../player/ai-controller/ai-player-handler";

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
export class CampaignPhaserWorldAdapter
  implements CampaignWorldActionAdapter, CampaignWorldConditionAdapter, CampaignEncounterWorldAdapter
{
  readonly presentationRequests$ = new Subject<CampaignPresentationRequest>();
  private readonly resources = new CampaignOwnedResourceRegistry();
  private readonly aoeZonesByEffectId = new Map<string, string>();
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
      case "set-ai-enabled":
        return this.setAiEnabled(context, definition);
      case "carry-actor":
        return this.carryActor(context, definition);
      case "drop-carried-actor":
        return this.dropCarriedActor(context, definition.actorId, definition.pointId);
      case "apply-disguise":
        return this.applyDisguise(context, definition);
      case "remove-disguise":
        return this.removeDisguise(context, definition.disguiseId);
      case "ai-directive":
        return this.executeAiDirective(definition);
      case "set-content-allowance":
        return this.setContentAllowance(context, definition);
      case "grant-temporary-modifier":
        return this.grantTemporaryModifier(context, definition);
      case "grant-content":
        return this.grantContent(context, definition);
      case "revoke-content-grant":
        return this.revokeContentGrant(context, definition.grantId);
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
      case "actor-distance": {
        const actor = this.actor(definition.actorId);
        const target = this.actor(definition.targetActorId);
        const actorPosition = actor ? getGameObjectLogicalTransform(actor) : undefined;
        const targetPosition = target ? getGameObjectLogicalTransform(target) : undefined;
        if (!actorPosition || !targetPosition) return false;
        return compare(
          Math.hypot(actorPosition.x - targetPosition.x, actorPosition.y - targetPosition.y),
          definition.comparison,
          definition.value
        );
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
          (getSceneService(this.scene, CampaignContentAllowanceService)?.isAllowed(
            definition.playerNumber,
            definition.contentType,
            definition.contentId
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

  /** Reapplies synchronized participant teams after save/load or reconnect snapshot replacement. */
  restoreParticipantTeams(participantTeams: Readonly<Record<string, number>>): void {
    for (const player of this.scene.players) {
      const playerNumber = player.playerNumber;
      const team = playerNumber === undefined ? undefined : participantTeams[String(playerNumber)];
      const definition = player.playerController.data.playerDefinition;
      if (team !== undefined && definition) definition.team = team;
    }
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
    this.temporaryModifiers.clear();
  }

  spawnWave(
    _encounterId: string,
    _waveId: string,
    groups: readonly MissionEncounterSpawnGroupDefinition[],
    spawnCursor: number
  ): CampaignEncounterSpawnResult {
    const created: Phaser.GameObjects.GameObject[] = [];
    let cursor = spawnCursor;
    try {
      for (const group of groups) {
        const set = this.scenarioRegistry?.spawnSet(group.spawnSetId);
        const fallback = group.fallbackSpawnSetId
          ? this.scenarioRegistry?.spawnSet(group.fallbackSpawnSetId)
          : undefined;
        const primaryPoints = rotate(this.availableSpawnPoints(set?.points ?? [], created), cursor);
        const fallbackPoints = rotate(this.availableSpawnPoints(fallback?.points ?? [], created), cursor);
        const selectedPoints =
          primaryPoints.length >= group.actors.length
            ? primaryPoints
            : fallbackPoints.length >= group.actors.length
              ? fallbackPoints
              : undefined;
        if (!selectedPoints) {
          for (const actor of created) actor.destroy();
          return {
            status: "blocked",
            reason: `Spawn set '${group.spawnSetId}' has ${primaryPoints.length} free points for ${group.actors.length} actors`
          };
        }
        for (const [index, actorDefinition] of group.actors.entries()) {
          const point = selectedPoints[index];
          if (!point) {
            for (const item of created) item.destroy();
            return {
              status: "failed",
              reason: `Spawn point ${index} is unavailable for '${actorDefinition.actorName}'`
            };
          }
          const actor = getSceneService(this.scene, SceneActorCreator)?.createFinishedActor(
            actorDefinition.actorName,
            point,
            actorDefinition.ownerPlayerNumber
          );
          if (!actor) {
            for (const item of created) item.destroy();
            return { status: "failed", reason: `Failed to spawn '${actorDefinition.actorName}'` };
          }
          created.push(actor);
          if (actorDefinition.scenarioRoleId) {
            this.scenarioRegistry?.claimActorRole(actor, actorDefinition.scenarioRoleId, actorDefinition.tags);
          }
        }
        cursor += group.actors.length;
      }
    } catch (error) {
      for (const actor of created) actor.destroy();
      return { status: "failed", reason: error instanceof Error ? error.message : "Encounter spawn failed" };
    }
    const actors: { actorRuntimeId: string; ownerPlayerNumber?: number }[] = [];
    for (const actor of created) {
      const actorRuntimeId = getActorComponent(actor, IdComponent)?.id;
      if (!actorRuntimeId) {
        for (const item of created) item.destroy();
        return { status: "failed", reason: `Spawned actor '${actor.name}' has no runtime ID` };
      }
      actors.push({
        actorRuntimeId,
        ownerPlayerNumber: getActorComponent(actor, OwnerComponent)?.getOwner()
      });
    }
    return {
      status: "spawned",
      actors
    };
  }

  isActorAlive(actorRuntimeId: string): boolean {
    const actor = getSceneService(this.scene, ActorIndexSystem)?.getActorById(actorRuntimeId);
    if (!actor?.active) return false;
    return getActorComponent(actor, HealthComponent)?.alive ?? true;
  }

  private availableSpawnPoints(
    points: readonly Vector3Simple[],
    created: readonly Phaser.GameObjects.GameObject[]
  ): readonly Vector3Simple[] {
    const actors = [...(getSceneService(this.scene, ActorIndexSystem)?.getAllIdActors() ?? []), ...created].filter(
      (actor, index, values) => actor.active && values.indexOf(actor) === index
    );
    return points.filter(
      (point) =>
        !actors.some((actor) => {
          const position = getGameObjectLogicalTransform(actor);
          return position ? samePosition(position, point) : false;
        })
    );
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
    const actors: Phaser.GameObjects.GameObject[] = [];
    const runtimeIds: string[] = [];
    for (const actorId of definition.actorIds) {
      const actor = this.actor(actorId);
      if (!actor) return missingReference(actorId);
      const runtimeId = getActorComponent(actor, IdComponent)?.id;
      if (!runtimeId) return executionFailed(`Campaign actor '${actorId}' has no runtime ID`);
      actors.push(actor);
      runtimeIds.push(runtimeId);
    }
    const firstActor = actors[0];
    if (!firstActor) return executionFailed(`Campaign order '${definition.id}' has no actors`);
    const owner = getActorComponent(firstActor, OwnerComponent)?.getOwner();
    const commandBus = getSceneService(this.scene, CommandBusService);
    if (owner === undefined || !commandBus) {
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
    const targetRuntimeId = targetActor ? getActorComponent(targetActor, IdComponent)?.id : undefined;
    if (targetActor && !targetRuntimeId) {
      return executionFailed(`Campaign target '${definition.targetActorId}' has no runtime ID`);
    }
    commandBus.dispatchDeterministic({
      type: ProbableWaffleGameCommandTypes.ActorAction,
      playerNumber: owner,
      actorIds: runtimeIds,
      orderType: definition.order === "attack" ? OrderType.Attack : OrderType.Move,
      targetObjectIds: targetRuntimeId ? [targetRuntimeId] : undefined,
      tileVec3: targetPoint,
      queue: definition.queue ?? definition.order === "patrol"
    });
    return completed();
  }

  private executeAiDirective(
    definition: Extract<MissionActionDefinition, { readonly kind: "ai-directive" }>
  ): CampaignMissionActionResult {
    const wrongOwner = definition.actorIds.find((actorId) => this.ownerOf(actorId) !== definition.playerNumber);
    if (wrongOwner) return missingReference(`player-${definition.playerNumber}-actor-${wrongOwner}`);
    const order =
      definition.directive === "stop"
        ? "stop"
        : definition.directive === "attack"
          ? "attack"
          : definition.directive === "patrol"
            ? "patrol"
            : "move";
    return this.issueOrder({
      id: definition.id,
      kind: "issue-order",
      actorIds: definition.actorIds,
      order,
      targetActorId: definition.targetActorId,
      targetPointId: definition.targetPointId,
      queue: definition.queue ?? definition.directive === "patrol"
    });
  }

  private setAiEnabled(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "set-ai-enabled" }>
  ): CampaignMissionActionResult {
    const playerDefinition = this.scene.players.find((player) => player.playerNumber === definition.playerNumber)
      ?.playerController.data.playerDefinition;
    if (playerDefinition?.campaignController !== "full-ai") {
      return missingReference(`full-ai-player-${definition.playerNumber}`);
    }
    const resourceId = `ai-enabled:${definition.playerNumber}`;
    const existingState = context.state.ownedResources[resourceId]?.state;
    const restoredPrevious = isRecord(existingState) ? existingState["previous"] : undefined;
    const previous =
      typeof restoredPrevious === "boolean" ? restoredPrevious : (playerDefinition.campaignAiEnabled ?? true);
    const aiHandler = this.scene.isHost ? getSceneSystem(this.scene, AiPlayerHandler) : undefined;
    if (this.scene.isHost && !aiHandler?.setPlayerEnabled(definition.playerNumber, definition.enabled)) {
      return missingReference(`full-ai-player-${definition.playerNumber}`);
    }
    playerDefinition.campaignAiEnabled = definition.enabled;
    this.resources.register(context.ownerToken, resourceId, () => {
      playerDefinition.campaignAiEnabled = previous;
      aiHandler?.setPlayerEnabled(definition.playerNumber, previous);
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "ai-enabled",
          state: { playerNumber: definition.playerNumber, value: definition.enabled, previous }
        }
      ]
    };
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
    updateCampaignAllianceDefinitions(playerDefinition, otherDefinition, playerNumber, otherPlayerNumber, allied);
    return completed();
  }

  private setContentAllowance(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "set-content-allowance" }>
  ): CampaignMissionActionResult {
    const allowance = getSceneService(this.scene, CampaignContentAllowanceService);
    if (!allowance) return executionFailed("Campaign content allowance authority is unavailable");
    const key = `${definition.playerNumber}:${definition.contentType}:${definition.contentId}`;
    const resourceId = `content-allowance:${key}`;
    const existingState = context.state.ownedResources[resourceId]?.state;
    const restoredPrevious = isRecord(existingState) ? existingState["previous"] : undefined;
    const currentPrevious = allowance.getOverride(
      definition.playerNumber,
      definition.contentType,
      definition.contentId
    );
    const previous =
      restoredPrevious === null || typeof restoredPrevious === "boolean" ? restoredPrevious : (currentPrevious ?? null);
    allowance.setOverride(definition.playerNumber, definition.contentType, definition.contentId, definition.allowed);
    this.resources.register(context.ownerToken, resourceId, () => {
      if (previous === null) {
        allowance.clearOverride(definition.playerNumber, definition.contentType, definition.contentId);
      } else {
        allowance.setOverride(definition.playerNumber, definition.contentType, definition.contentId, previous);
      }
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "content-allowance",
          state: {
            playerNumber: definition.playerNumber,
            contentType: definition.contentType,
            contentId: definition.contentId,
            value: definition.allowed,
            previous
          }
        }
      ]
    };
  }

  private grantContent(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "grant-content" }>
  ): CampaignMissionActionResult {
    const allowance = getSceneService(this.scene, CampaignContentAllowanceService);
    if (!allowance) return executionFailed("Campaign content allowance authority is unavailable");
    const resourceId = `content-grant:${definition.grantId}`;
    const existingState = context.state.ownedResources[resourceId]?.state;
    const restoredPrevious = isRecord(existingState) ? existingState["previous"] : undefined;
    const currentPrevious = allowance.getGrant(definition.grantId);
    const previous = isRecord(restoredPrevious)
      ? contentGrantFromState(restoredPrevious)
      : restoredPrevious === null
        ? undefined
        : currentPrevious;
    allowance.grant(definition);
    this.resources.register(context.ownerToken, resourceId, () => {
      if (previous) allowance.grant(previous);
      else allowance.revoke(definition.grantId);
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "content-grant",
          state: {
            grantId: definition.grantId,
            playerNumber: definition.playerNumber,
            contentType: definition.contentType,
            contentId: definition.contentId,
            previous: previous ? contentGrantState(previous) : null
          }
        }
      ]
    };
  }

  private revokeContentGrant(context: CampaignMissionActionContext, grantId: string): CampaignMissionActionResult {
    const allowance = getSceneService(this.scene, CampaignContentAllowanceService);
    if (!allowance) return executionFailed("Campaign content allowance authority is unavailable");
    const resourceId = `content-grant-revocation:${grantId}`;
    const existingState = context.state.ownedResources[resourceId]?.state;
    const restoredPrevious = isRecord(existingState) ? existingState["previous"] : undefined;
    const currentPrevious = allowance.getGrant(grantId);
    const previous = isRecord(restoredPrevious)
      ? contentGrantFromState(restoredPrevious)
      : restoredPrevious === null
        ? undefined
        : currentPrevious;
    allowance.revoke(grantId);
    this.resources.register(context.ownerToken, resourceId, () => {
      if (previous) allowance.grant(previous);
    });
    return {
      status: "completed",
      ownedResources: [
        {
          resourceId,
          kind: "content-grant-revocation",
          state: { grantId, previous: previous ? contentGrantState(previous) : null }
        }
      ]
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

  private carryActor(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "carry-actor" }>
  ): CampaignMissionActionResult {
    const actor = this.actor(definition.actorId);
    const carrier = this.actor(definition.carrierActorId);
    const previousPosition = actor ? getGameObjectLogicalTransform(actor) : undefined;
    const carrierPosition = carrier ? getGameObjectLogicalTransform(carrier) : undefined;
    const translate = actor ? getActorComponent(actor, ActorTranslateComponent) : undefined;
    if (!actor || !carrier || !previousPosition || !carrierPosition || !translate) {
      return missingReference(!actor ? definition.actorId : definition.carrierActorId);
    }
    const visible = (actor as unknown as Phaser.GameObjects.Components.Visible).visible;
    translate.moveActorToLogicalPosition(carrierPosition);
    (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(false);
    const resourceId = `quest-carry:${definition.actorId}`;
    const state = {
      actorId: definition.actorId,
      carrierActorId: definition.carrierActorId,
      previousPosition: toRuntimeJsonValue(previousPosition),
      previousVisible: visible
    };
    this.registerQuestCarry(context.ownerToken, resourceId, state);
    return { status: "completed", ownedResources: [{ resourceId, kind: "quest-carry", state }] };
  }

  private dropCarriedActor(
    context: CampaignMissionActionContext,
    actorId: ScenarioActorId,
    pointId: ScenarioPointId
  ): CampaignMissionActionResult {
    const resourceId = `quest-carry:${actorId}`;
    const resource = context.state.ownedResources[resourceId];
    const actor = this.actor(actorId);
    const point = this.point(pointId);
    const translate = actor ? getActorComponent(actor, ActorTranslateComponent) : undefined;
    if (!resource || !actor || !point || !translate) return missingReference(!resource ? resourceId : actorId);
    const leaked = this.resources.release(resource.ownerToken, [resourceId], "action-removed");
    delete context.state.ownedResources[resourceId];
    if (leaked.length > 0) return executionFailed(`Quest carry '${actorId}' failed cleanup`);
    translate.moveActorToLogicalPosition(point);
    (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(true);
    return completed();
  }

  private applyDisguise(
    context: CampaignMissionActionContext,
    definition: Extract<MissionActionDefinition, { readonly kind: "apply-disguise" }>
  ): CampaignMissionActionResult {
    const actors = definition.actorIds.map((actorId) => ({ actorId, actor: this.actor(actorId) }));
    const missing = actors.find((entry) => !entry.actor);
    if (missing) return missingReference(missing.actorId);
    const opacity = definition.opacity ?? 0.72;
    const previous = actors.map(({ actorId, actor }) => ({
      actorId,
      opacity: (actor as unknown as Phaser.GameObjects.Components.Alpha).alpha,
      disguise: typeof actor!.getData("campaign.disguise") === "string" ? actor!.getData("campaign.disguise") : null
    }));
    const state = { disguiseId: definition.disguiseId, actorIds: definition.actorIds, opacity, previous };
    const resourceId = `disguise:${definition.disguiseId}`;
    this.projectDisguise(definition.disguiseId, definition.actorIds, opacity);
    this.registerDisguise(context.ownerToken, resourceId, state);
    return { status: "completed", ownedResources: [{ resourceId, kind: "disguise", state }] };
  }

  private removeDisguise(context: CampaignMissionActionContext, disguiseId: string): CampaignMissionActionResult {
    const resourceId = `disguise:${disguiseId}`;
    const resource = context.state.ownedResources[resourceId];
    if (!resource) return missingReference(resourceId);
    const leaked = this.resources.release(resource.ownerToken, [resourceId], "action-removed");
    delete context.state.ownedResources[resourceId];
    return leaked.length > 0 ? executionFailed(`Disguise '${disguiseId}' failed cleanup`) : completed();
  }

  private registerQuestCarry(ownerToken: string, resourceId: string, state: CampaignMissionRuntimeJsonValue): void {
    if (!isRecord(state)) return;
    const actorId = state["actorId"];
    const previousPosition = vector3FromState(state["previousPosition"]);
    const previousVisible = state["previousVisible"];
    if (typeof actorId !== "string" || !previousPosition || typeof previousVisible !== "boolean") return;
    const actor = this.actor(actorId as ScenarioActorId);
    const translate = actor ? getActorComponent(actor, ActorTranslateComponent) : undefined;
    if (!actor || !translate) return;
    this.resources.register(ownerToken, resourceId, () => {
      if (!actor.scene) return;
      translate.moveActorToLogicalPosition(previousPosition);
      (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(previousVisible);
    });
  }

  private projectDisguise(disguiseId: string, actorIds: readonly ScenarioActorId[], opacity: number): void {
    for (const actorId of actorIds) {
      const actor = this.actor(actorId);
      if (!actor) continue;
      actor.setData("campaign.disguise", disguiseId);
      (actor as unknown as Phaser.GameObjects.Components.Alpha).setAlpha?.(opacity);
    }
  }

  private registerDisguise(ownerToken: string, resourceId: string, state: CampaignMissionRuntimeJsonValue): void {
    if (!isRecord(state) || !Array.isArray(state["previous"])) return;
    const previous = state["previous"];
    this.resources.register(ownerToken, resourceId, () => {
      for (const entry of previous) {
        if (!isRecord(entry)) continue;
        const actorId = entry["actorId"];
        const opacity = entry["opacity"];
        const disguise = entry["disguise"];
        if (typeof actorId !== "string" || typeof opacity !== "number") continue;
        const actor = this.actor(actorId as ScenarioActorId);
        if (!actor) continue;
        if (typeof disguise === "string") actor.setData("campaign.disguise", disguise);
        else actor.data?.remove("campaign.disguise");
        (actor as unknown as Phaser.GameObjects.Components.Alpha).setAlpha?.(opacity);
      }
    });
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
      const playerNumber = resource.state["playerNumber"];
      const contentType = resource.state["contentType"];
      const contentId = resource.state["contentId"];
      const value = resource.state["value"];
      const previous = resource.state["previous"];
      const allowance = getSceneService(this.scene, CampaignContentAllowanceService);
      if (
        typeof playerNumber !== "number" ||
        (contentType !== "actor" && contentType !== "research") ||
        typeof contentId !== "string" ||
        typeof value !== "boolean" ||
        (previous !== null && typeof previous !== "boolean") ||
        !allowance
      )
        return;
      const typedContentId = contentId as CampaignAllowedContentId;
      allowance.setOverride(playerNumber, contentType, typedContentId, value);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        if (previous === null) allowance.clearOverride(playerNumber, contentType, typedContentId);
        else allowance.setOverride(playerNumber, contentType, typedContentId, previous);
      });
    } else if (resource.kind === "ai-enabled") {
      const playerNumber = resource.state["playerNumber"];
      const value = resource.state["value"];
      const previous = resource.state["previous"];
      if (typeof playerNumber !== "number" || typeof value !== "boolean" || typeof previous !== "boolean") return;
      const playerDefinition = this.scene.players.find((player) => player.playerNumber === playerNumber)
        ?.playerController.data.playerDefinition;
      if (playerDefinition?.campaignController !== "full-ai") return;
      const aiHandler = this.scene.isHost ? getSceneSystem(this.scene, AiPlayerHandler) : undefined;
      if (this.scene.isHost && !aiHandler?.setPlayerEnabled(playerNumber, value)) return;
      playerDefinition.campaignAiEnabled = value;
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        playerDefinition.campaignAiEnabled = previous;
        aiHandler?.setPlayerEnabled(playerNumber, previous);
      });
    } else if (resource.kind === "content-grant") {
      const grant = contentGrantFromState(resource.state);
      const previous = isRecord(resource.state["previous"])
        ? contentGrantFromState(resource.state["previous"])
        : undefined;
      const allowance = getSceneService(this.scene, CampaignContentAllowanceService);
      if (!grant || !allowance) return;
      allowance.grant(grant);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        if (previous) allowance.grant(previous);
        else allowance.revoke(grant.grantId);
      });
    } else if (resource.kind === "content-grant-revocation") {
      const previous = isRecord(resource.state["previous"])
        ? contentGrantFromState(resource.state["previous"])
        : undefined;
      const grantId = resource.state["grantId"];
      const allowance = getSceneService(this.scene, CampaignContentAllowanceService);
      if (typeof grantId !== "string" || !allowance) return;
      allowance.revoke(grantId);
      this.resources.register(resource.ownerToken, resource.resourceId, () => {
        if (previous) allowance.grant(previous);
      });
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
    } else if (resource.kind === "quest-carry") {
      const actorId = resource.state["actorId"];
      const carrierActorId = resource.state["carrierActorId"];
      if (typeof actorId !== "string" || typeof carrierActorId !== "string") return;
      const actor = this.actor(actorId as ScenarioActorId);
      const carrier = this.actor(carrierActorId as ScenarioActorId);
      const carrierPosition = carrier ? getGameObjectLogicalTransform(carrier) : undefined;
      const translate = actor ? getActorComponent(actor, ActorTranslateComponent) : undefined;
      if (!actor || !carrierPosition || !translate) return;
      translate.moveActorToLogicalPosition(carrierPosition);
      (actor as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(false);
      this.registerQuestCarry(resource.ownerToken, resource.resourceId, resource.state);
    } else if (resource.kind === "disguise") {
      const disguiseId = resource.state["disguiseId"];
      const actorIds = resource.state["actorIds"];
      const opacity = resource.state["opacity"];
      if (
        typeof disguiseId !== "string" ||
        !Array.isArray(actorIds) ||
        !actorIds.every((actorId): actorId is string => typeof actorId === "string") ||
        typeof opacity !== "number"
      )
        return;
      this.projectDisguise(disguiseId, actorIds as ScenarioActorId[], opacity);
      this.registerDisguise(resource.ownerToken, resource.resourceId, resource.state);
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

function vector3FromState(value: CampaignMissionRuntimeJsonValue | undefined): Vector3Simple | undefined {
  if (!isRecord(value)) return undefined;
  const x = value["x"];
  const y = value["y"];
  const z = value["z"];
  return typeof x === "number" && typeof y === "number" && typeof z === "number" ? { x, y, z } : undefined;
}

function samePosition(left: Vector3Simple, right: Vector3Simple): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}

function rotate<T>(values: readonly T[], offset: number): readonly T[] {
  if (values.length === 0) return values;
  const index = offset % values.length;
  return [...values.slice(index), ...values.slice(0, index)];
}

export function updateCampaignAllianceDefinitions(
  playerDefinition: PositionPlayerDefinition,
  otherDefinition: PositionPlayerDefinition,
  playerNumber: number,
  otherPlayerNumber: number,
  allied: boolean
): void {
  const participantTeams = {
    [String(playerNumber)]: playerDefinition.team ?? playerNumber,
    [String(otherPlayerNumber)]: otherDefinition.team ?? otherPlayerNumber
  };
  updateCampaignParticipantTeams(participantTeams, playerNumber, otherPlayerNumber, allied);
  playerDefinition.team = participantTeams[String(playerNumber)];
  otherDefinition.team = participantTeams[String(otherPlayerNumber)];
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

function contentGrantFromState(
  state: Readonly<Record<string, CampaignMissionRuntimeJsonValue>>
): CampaignTemporaryContentGrant | undefined {
  const grantId = state["grantId"];
  const playerNumber = state["playerNumber"];
  const contentType = state["contentType"];
  const contentId = state["contentId"];
  if (
    typeof grantId !== "string" ||
    typeof playerNumber !== "number" ||
    (contentType !== "actor" && contentType !== "research") ||
    typeof contentId !== "string"
  ) {
    return undefined;
  }
  return { grantId, playerNumber, contentType, contentId: contentId as CampaignAllowedContentId };
}

function contentGrantState(grant: CampaignTemporaryContentGrant): CampaignMissionRuntimeJsonValue {
  return {
    grantId: grant.grantId,
    playerNumber: grant.playerNumber,
    contentType: grant.contentType,
    contentId: grant.contentId
  };
}

function playerFaction(scene: ProbableWaffleScene, playerNumber: number): "tivara" | "skaduwee" | undefined {
  const faction = getPlayer(scene, playerNumber)?.factionType;
  return faction === 1 ? "tivara" : faction === 2 ? "skaduwee" : undefined;
}

function toRuntimeJsonValue(value: unknown): CampaignMissionRuntimeJsonValue {
  return JSON.parse(JSON.stringify(value)) as CampaignMissionRuntimeJsonValue;
}
