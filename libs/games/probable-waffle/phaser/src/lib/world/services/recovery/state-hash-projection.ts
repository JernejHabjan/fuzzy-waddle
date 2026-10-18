import Phaser from "phaser";
import type { ActorDefinition } from "@fuzzy-waddle/probable-waffle-protocol";
import { getSceneService } from "../scene-component-helpers";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { HealingComponent } from "../../../entity/components/combat/components/healing-component";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ActorManager } from "../../../data/actor-manager";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import {
  serializeCampaignMissionRuntimeState,
  serializeCampaignMissionRuntimeStateFamilies
} from "@fuzzy-waddle/probable-waffle-campaign";
import { RandomService } from "../random.service";
import type { AuthoritativeStateProjectionV1 } from "./authoritative-state-projection";
import type { StableSerializable } from "./stable-hash-value";
import type { HashOrder } from "./hash-order";

/** Owns canonical native world projection; no subscriptions, transport or correction lifecycle. */
export class StateHashProjection {
  /**
   * Captures the reusable authoritative projection at the caller's completed simulation boundary.
   * Multiplayer and Stage 5 scenario reports therefore compare the same world facts while using
   * distinct digest algorithms and retaining normalized field diagnostics.
   */
  captureAuthoritativeProjection(scene: Phaser.Scene): AuthoritativeStateProjectionV1 {
    const campaignMission = (scene as ProbableWaffleScene).baseGameData.gameInstance.gameState?.data.campaignMission;
    const campaignMissionDigest = campaignMission ? djb2(serializeCampaignMissionRuntimeState(campaignMission)) : "";
    const campaignMissionFamilyDigests = campaignMission
      ? Object.fromEntries(
          Object.entries(serializeCampaignMissionRuntimeStateFamilies(campaignMission)).map(([family, value]) => [
            family,
            djb2(value)
          ])
        )
      : {};
    const randomState = getSceneService(scene, RandomService)?.getState();
    const randomDigest = randomState
      ? djb2(`${randomState.schemaVersion}:${randomState.generatorState}:${randomState.operationCount}`)
      : "";
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    if (!actorIndex) {
      return {
        schemaVersion: 1,
        actors: [],
        players: [],
        research: [],
        campaignMission: campaignMissionDigest,
        campaignMissionFamilies: campaignMissionFamilyDigests,
        random: randomDigest,
        systems: this.serializeHarnessSystemState(scene)
      };
    }

    const actors = actorIndex
      .getAllIdActors()
      .filter((go) => !this.shouldIgnoreForStateHash(go))
      .map((go) => {
        const id = getActorComponent(go, IdComponent)?.id ?? "";
        const health = getActorComponent(go, HealthComponent)?.healthComponentData.health ?? -1;
        const armour = getActorComponent(go, HealthComponent)?.healthComponentData.armour ?? -1;
        const tile = getGameObjectCurrentTile(go);
        const pos = getGameObjectLogicalTransform(go);
        const lx = tile ? tile.x : pos ? Math.round(pos.x) : 0;
        const ly = tile ? tile.y : pos ? Math.round(pos.y) : 0;
        const lz = pos ? Math.round(pos.z) : 0;
        const owner = getActorComponent(go, OwnerComponent)?.getOwner() ?? -1;
        const actor = ActorManager.getActorDefinitionFromActor(go) ?? {};
        const queueState = this.serializeActorQueueState(actor);
        const economyState = this.serializeActorEconomyState(actor);
        const combatState = this.serializeActorCombatState(go);
        const orderState = this.serializeActorOrderState(go);
        const scenarioState = actor.scenario
          ? this.stableSerialize({ roleId: actor.scenario.roleId, tags: actor.scenario.tags })
          : "";
        const actorDigest = [
          id, go.name, Math.round(health), Math.round(armour), lx, ly, lz, owner,
          queueState, economyState, combatState, orderState, scenarioState
        ].join(":");
        const aiState = {
          gatherer: actor.gatherer ?? null,
          container: actor.container ?? null,
          production: actor.production ?? null,
          research: actor.research ?? null,
          spell: actor.spell ?? null,
          statusEffects: actor.statusEffects ?? null,
          tendable: actor.tendable ?? null,
          convertible: actor.convertible ?? null
        };
        return { actorId: id, digest: actorDigest, aiState };
      });

    // Sort by the ID prefix (first segment before ':') for deterministic ordering.
    actors.sort((left, right) => left.digest.localeCompare(right.digest));
    const playerStateEntries = this.serializePlayerStates(scene);
    const researchEntries = this.serializeResearchState(scene);
    return {
      schemaVersion: 1,
      actors,
      players: playerStateEntries,
      research: researchEntries,
      campaignMission: campaignMissionDigest,
      campaignMissionFamilies: campaignMissionFamilyDigests,
      random: randomDigest,
      systems: this.serializeHarnessSystemState(scene)
    };
  }

  /** Additional save-owned continuations used by AI harness reports without changing the multiplayer hash contract. */
  private serializeHarnessSystemState(scene: Phaser.Scene): Readonly<Record<string, string>> {
    const gameState = (scene as ProbableWaffleScene).baseGameData.gameInstance.gameState?.data;
    const aiControllers = (scene as ProbableWaffleScene).players
      .map((player) => [String(player.playerNumber ?? -1), player.playerState.data.aiBehaviorTreeState] as const)
      .filter((entry) => entry[1] !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return {
      aiControllers: this.stableSerialize(this.toStableSerializable(Object.fromEntries(aiControllers))),
      aoeZones: this.stableSerialize(this.toStableSerializable(gameState?.aoeZones ?? [])),
      commandAuthority: this.stableSerialize(this.toStableSerializable(gameState?.commandAuthority ?? null)),
      summonExpiries: this.stableSerialize(this.toStableSerializable(gameState?.summonExpiries ?? []))
    };
  }

  private toStableSerializable(value: unknown): StableSerializable {
    if (value === null || value === undefined) return value;
    if (typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
    if (Array.isArray(value)) return value.map((entry) => this.toStableSerializable(entry));
    if (typeof value === "object") {
      const record = value as Readonly<Record<string, unknown>>;
      return Object.fromEntries(
        Object.keys(record)
          .sort()
          .map((key) => [key, this.toStableSerializable(record[key])])
      );
    }
    return String(value);
  }

  /**
   * Exhausted neutral resource nodes can legitimately be missing on one peer after
   * prior divergence and do not affect future deterministic simulation decisions.
   * Exclude them from hash to avoid permanent false desync loops.
   */
  private shouldIgnoreForStateHash(actor: Phaser.GameObjects.GameObject): boolean {
    const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
    const isNeutral = owner === undefined || owner === -1;

    if (isNeutral) {
      const hasHealth = !!getActorComponent(actor, HealthComponent);
      const hasResourceSource = !!getActorComponent(actor, ResourceSourceComponent);
      // Neutral scenery actors (no health/resource state) are visual map props and should
      // not trigger desync correction loops when clients cull them differently.
      if (!hasHealth && !hasResourceSource) {
        return true;
      }
      // Neutral resources are map-owned economy sources. Hashing all idle sources causes
      // persistent correction loops when static map resources diverge by presence only.
      // Active harvesting still influences deterministic player-resource digests.
      if (hasResourceSource) {
        const resourceSource = getActorComponent(actor, ResourceSourceComponent);
        if (resourceSource && resourceSource.getAssignedGatherersCount() === 0) {
          return true;
        }
      }
    }

    if (!isNeutral) {
      return false;
    }
    const resourceSource = getActorComponent(actor, ResourceSourceComponent);
    if (!resourceSource) {
      return false;
    }
    return resourceSource.getCurrentResources() <= 0;
  }

  /** Documents the serialize actor queue state member and its declared contract at this boundary. */
  private serializeActorQueueState(actor: Pick<ActorDefinition, "production" | "research">): string {
    const productionQueue = actor.production?.queue ?? [];
    const researchQueue = actor.research?.researches ?? [];
    const serializedProduction = productionQueue
      .map(
        (item: { name?: string; remainingTime?: number }) =>
          `${item.name ?? "?"}:${Math.round(item.remainingTime ?? 0)}`
      )
      .join(",");
    const serializedResearch = researchQueue
      .map(
        (item: { type?: string; remainingTime?: number }) =>
          `${item.type ?? "?"}:${Math.round(item.remainingTime ?? 0)}`
      )
      .join(",");
    return `${serializedProduction};${serializedResearch}`;
  }

  /** Documents the serialize actor economy state member and its declared contract at this boundary. */
  private serializeActorEconomyState(
    actor: Pick<ActorDefinition, "gatherer" | "resourceSource" | "resourceDrain" | "container">
  ): string {
    const gathered = `${actor.gatherer?.carriedResourceType ?? "none"}:${Math.round(actor.gatherer?.carriedResourceAmount ?? 0)}`;
    const source = Math.round(actor.resourceSource?.currentResources ?? -1);
    const drain = Math.round(actor.resourceDrain?.currentCapacity ?? -1);
    const container = (actor.container?.containedIds ?? []).slice().sort().join(",");
    return `${gathered}:${source}:${drain}:${container}`;
  }

  /** Documents the serialize actor combat state member and its declared contract at this boundary. */
  private serializeActorCombatState(actor: Phaser.GameObjects.GameObject): string {
    const attackCooldown = Math.round(getActorComponent(actor, AttackComponent)?.remainingCooldown ?? -1);
    const healingCooldown = Math.round(getActorComponent(actor, HealingComponent)?.remainingCooldown ?? -1);
    const builderCooldown = Math.round(getActorComponent(actor, BuilderComponent)?.remainingCooldown ?? -1);
    const gathererComponent = getActorComponent(actor, GathererComponent);
    const gathererCooldown = Math.round(gathererComponent?.remainingCooldown ?? -1);
    const gatherSourceId = gathererComponent?.currentResourceSource
      ? (getActorComponent(gathererComponent.currentResourceSource, IdComponent)?.id ?? "")
      : "";
    return `${attackCooldown}:${healingCooldown}:${builderCooldown}:${gathererCooldown}:${gatherSourceId}`;
  }

  /** Documents the serialize actor order state member and its declared contract at this boundary. */
  private serializeActorOrderState(actor: Phaser.GameObjects.GameObject): string {
    const blackboard = getActorComponent(actor, PawnAiController)?.getData().blackboard;
    if (!blackboard) {
      return "";
    }

    // Hash stable order intent only. Full blackboard/runtime blobs contain transient
    // bookkeeping like status and failed-order history that can differ briefly after
    // correction without changing future gameplay decisions. Keeping the hash focused
    // on current/queued order intent makes desync reports point at actual sim drift.
    return this.stableSerialize({
      currentOrder: this.summarizeOrderForHash(blackboard.currentOrder),
      orderQueue: (blackboard.orderQueue ?? []).map((order: unknown) => this.summarizeOrderForHash(order)),
      queueLength: Array.isArray(blackboard.orderQueue) ? blackboard.orderQueue.length : 0
    });
  }

  /**
   * Reduce an order object to the deterministic intent that should affect future sim:
   * order type, stable actor target id, and logical tile target. Volatile runtime
   * references and bookkeeping fields are intentionally excluded from the hash.
   */
  private summarizeOrderForHash(order: unknown): StableSerializable {
    if (!order || typeof order !== "object") {
      return this.toStableScalar(order);
    }

    const orderRecord = order as HashOrder;
    const data = orderRecord.data ?? undefined;
    const targetTileLocation = data?.targetTileLocation
      ? {
          x: Math.round(Number(data.targetTileLocation.x ?? 0)),
          y: Math.round(Number(data.targetTileLocation.y ?? 0)),
          z: Math.round(Number(data.targetTileLocation.z ?? 0))
        }
      : undefined;

    return {
      orderType: this.toStableScalar(orderRecord.orderType),
      data: {
        targetGameObjectId: this.toStableScalar(data?.targetGameObjectId),
        targetTileLocation
      }
    };
  }

  private toStableScalar(value: unknown): StableSerializable {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    return value === undefined ? null : String(value);
  }

  /** Documents the stable serialize member and its declared contract at this boundary. */
  private stableSerialize(value: StableSerializable): string {
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return "undefined";
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableSerialize(item)).join(",")}]`;
    }
    if (typeof value === "object") {
      const record = value as { readonly [key: string]: StableSerializable };
      return `{${Object.keys(record)
        .sort()
        .map((key) => `${key}:${this.stableSerialize(record[key])}`)
        .join(",")}}`;
    }
    return String(value);
  }

  /** Documents the serialize player states member and its declared contract at this boundary. */
  private serializePlayerStates(scene: Phaser.Scene): string[] {
    const probableWaffleScene = scene as ProbableWaffleScene;
    return [...probableWaffleScene.players]
      .sort((a, b) => (a.playerNumber ?? 0) - (b.playerNumber ?? 0))
      .map((player) => {
        const playerNumber = player.playerNumber ?? -1;
        const resources = player.playerState.data.resources;
        return `${playerNumber}:${resources.minerals ?? 0}:${resources.stone ?? 0}:${resources.wood ?? 0}`;
      });
  }

  /** Documents the serialize research state member and its declared contract at this boundary. */
  private serializeResearchState(scene: Phaser.Scene): string[] {
    const playerResearch =
      (scene as ProbableWaffleScene).baseGameData.gameInstance.gameState?.data.playerResearch ?? {};
    return Object.entries(playerResearch)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([playerNumber, researches]) => `${playerNumber}:${[...(researches ?? [])].sort().join(",")}`);
  }

}

/**
 * Fast non-cryptographic djb2 hash.
 * Deterministic and cheap — good enough for desync detection.
 */
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    // Bitwise OR keeps the value as a 32-bit integer throughout.
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h | 0;
  }
  // Convert to unsigned hex so the string is always non-negative.
  return (h >>> 0).toString(16);
}
