import Phaser from "phaser";
import { getGameModeFromScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";
import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import {
  ObjectNames,
  type ProbableWaffleGameMode,
  ProbableWafflePlayer,
  ResourceType,
  type ResearchType,
  type AiObservationMemoryStateData
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  canonicalizeAiObservationV1,
  type AiCapabilityCatalogEntryV1,
  type AiCapabilityCatalogV1,
  type AiDomainV1,
  type AiKnownValueV1,
  type AiObservedAccessProductV1,
  type AiObservedActorV1,
  type AiObservedEffectV1,
  type AiObservationV1
} from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import { getResearchedLevelForActor } from "../../../data/actor-level-utils";
import {
  canActorTraverseTile,
  getGameObjectCurrentTile,
  getGameObjectLogicalTransform,
  isSceneActive
} from "../../../data/game-object-helper";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { HealingComponent } from "../../../entity/components/combat/components/healing-component";
import { SpellComponent } from "../../../entity/components/combat/components/spell-component";
import { spellDefinitions } from "../../../entity/components/combat/spell-definitions";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { ResourceDrainComponent } from "../../../entity/components/resource/resource-drain-component";
import { ContainableComponent } from "../../../entity/components/building/containable-component";
import { ContainerComponent } from "../../../entity/components/building/container-component";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { StatusEffectComponent } from "../../../entity/components/status-effect/status-effect-component";
import { VisionComponent } from "../../../entity/components/vision-component";
import { AoeZoneManager } from "../../../entity/systems/aoe-zone-manager";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { ColliderComponent } from "../../../entity/components/movement/collider-component";
import { NavigableComponent } from "../../../entity/components/movement/navigable-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { NavigationService } from "../../../world/services/navigation.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { AiObservationVisibilityPolicy, type AiObservationInformationPolicy } from "./ai-observation-visibility-policy";
import { AiAccessGraphAdapter } from "./ai-access-graph.adapter";
import { getPlayerRelation } from "../../../data/player-relation";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";

type GameObject = Phaser.GameObjects.GameObject;

const MAX_ACCESS_PRODUCTS_PER_OBSERVATION = 4;
const MAX_INVALIDATION_DEBT = 1024;
const MAX_REMEMBERED_CONTACTS = 512;
const CONTACT_MEMORY_TICKS = 1200;
const MEMORY_DECAY_PER_TICK = 1;

type RememberedContact = AiObservationMemoryStateData["contacts"][number];

/** Read-only diagnostic projection; it never reaches back into the live world. */
export interface AiObservationDebugSnapshot {
  readonly policy: AiObservationInformationPolicy;
  readonly requestedGeneration: number;
  readonly committedGeneration: number;
  readonly committedTick: number | null;
  readonly observationAgeTicks: number | null;
  readonly visibleContactCount: number;
  readonly rememberedContactCount: number;
  readonly unknownFactCount: number;
  readonly queryInputRevision: number;
  readonly queryContinuationCursor: number;
  readonly invalidationDebt: number;
  readonly lastCommitError: string | null;
}

/**
 * Produces one canonical immutable observation at a simulation boundary. Expensive
 * access work is independently bounded and represented as pending/blocked/error
 * products, so it cannot delay urgent visible-defense information.
 */
export class AiObservationPipeline {
  private requestedGeneration = 0;
  private committedGeneration = 0;
  private committedTick = 0;
  private knowledgeRevision = 0;
  private queryInputRevision = 0;
  private queryContinuationCursor = 0;
  private invalidationDebt = 0;
  private readonly memory = new Map<ActorId, RememberedContact>();
  private latestObservation?: AiObservationV1;
  private latestCatalog?: AiCapabilityCatalogV1;
  private lastCommitError: string | null = null;
  private navigationInvalidationListener?: () => void;
  private readonly accessGraphAdapter: AiAccessGraphAdapter;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly getDeliveredIncomePerMinute?: (resourceType: ResourceType) => number | undefined
  ) {
    this.accessGraphAdapter = new AiAccessGraphAdapter(scene);
    this.navigationInvalidationListener = () => {
      this.queryInputRevision += 1;
      this.invalidationDebt = accumulateObservationInvalidationDebt(this.invalidationDebt);
    };
    scene.events.on(NavigationService.UpdateNavigationEvent, this.navigationInvalidationListener);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Captures and atomically publishes the newest generation, rejecting late work by generation. */
  async refresh(tick: number): Promise<AiObservationV1 | undefined> {
    if (this.player.playerNumber === undefined || !this.player.factionType || !isSceneActive(this.scene)) {
      return this.latestObservation;
    }
    const generation = ++this.requestedGeneration;
    const policy = new AiObservationVisibilityPolicy(this.scene, this.player.playerNumber);
    try {
      const captured = this.capture(generation, tick, policy);
      // This guard is deliberately after capture: a future async query implementation
      // may never publish an older snapshot over a newer decision boundary.
      if (!isCurrentObservationGeneration(this.requestedGeneration, generation) || !isSceneActive(this.scene)) {
        return this.latestObservation;
      }
      this.latestObservation = canonicalizeAiObservationV1(captured.observation);
      this.latestCatalog = captured.catalog;
      this.committedGeneration = generation;
      this.committedTick = tick;
      this.lastCommitError = null;
      return this.latestObservation;
    } catch (error) {
      this.lastCommitError = error instanceof Error ? error.message : String(error);
      return this.latestObservation;
    }
  }

  getObservation(): AiObservationV1 | undefined {
    return this.latestObservation;
  }

  getCapabilityCatalog(): AiCapabilityCatalogV1 | undefined {
    return this.latestCatalog;
  }

  getDebugSnapshot(): AiObservationDebugSnapshot {
    const actors = this.latestObservation?.actors ?? [];
    const currentTick = getSceneService(this.scene, SimulationTickService)?.currentTick;
    return {
      policy:
        this.player.playerNumber === undefined
          ? "skirmish"
          : new AiObservationVisibilityPolicy(this.scene, this.player.playerNumber).informationPolicy,
      requestedGeneration: this.requestedGeneration,
      committedGeneration: this.committedGeneration,
      committedTick: this.latestObservation ? this.committedTick : null,
      observationAgeTicks:
        this.latestObservation && currentTick !== undefined ? Math.max(0, currentTick - this.committedTick) : null,
      visibleContactCount: actors.filter((actor) => actor.visibility === "visible").length,
      rememberedContactCount: actors.filter((actor) => actor.visibility === "last_seen").length,
      unknownFactCount: this.countUnknownFacts(this.latestObservation),
      queryInputRevision: this.queryInputRevision,
      queryContinuationCursor: this.queryContinuationCursor,
      invalidationDebt: this.invalidationDebt,
      lastCommitError: this.lastCommitError
    };
  }

  getState(): AiObservationMemoryStateData {
    return {
      schemaVersion: 1,
      generation: this.committedGeneration,
      committedTick: this.committedTick,
      knowledgeRevision: this.knowledgeRevision,
      queryInputRevision: this.queryInputRevision,
      queryContinuationCursor: this.queryContinuationCursor,
      invalidationDebt: this.invalidationDebt,
      contacts: [...this.memory.values()]
        .sort((left, right) => left.actorId.localeCompare(right.actorId))
        .map(cloneRememberedContact)
    };
  }

  /** Restores only validated shape-compatible memory; the next capture rebuilds all live handles. */
  setState(state: AiObservationMemoryStateData): void {
    const normalized = normalizeAiObservationMemoryState(state);
    if (!normalized) return;
    this.committedGeneration = normalized.generation;
    this.requestedGeneration = Math.max(this.requestedGeneration, this.committedGeneration);
    this.committedTick = normalized.committedTick;
    this.knowledgeRevision = normalized.knowledgeRevision;
    this.queryInputRevision = normalized.queryInputRevision;
    this.queryContinuationCursor = normalized.queryContinuationCursor;
    this.invalidationDebt = Math.min(MAX_INVALIDATION_DEBT, normalized.invalidationDebt);
    this.memory.clear();
    for (const contact of normalized.contacts) this.memory.set(contact.actorId, cloneRememberedContact(contact));
  }

  private capture(
    generation: number,
    tick: number,
    policy: AiObservationVisibilityPolicy
  ): { observation: AiObservationV1; catalog: AiCapabilityCatalogV1 } {
    const playerNumber = this.player.playerNumber!;
    const index = getSceneService(this.scene, ActorIndexSystem);
    const liveActors = (index?.getAllIdActors() ?? [])
      .filter((actor) => this.isEligibleActor(actor))
      .sort(compareByActorId);
    let projectedActors: AiObservedActorV1[] = [];
    const liveById = new Map<ActorId, GameObject>();
    const catalogEntries = new Map<string, AiCapabilityCatalogEntryV1>();

    for (const actor of liveActors) {
      const actorId = getActorComponent(actor, IdComponent)?.id;
      if (!actorId) continue;
      const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
      const relation = policy.relationTo(actor);
      const owned = owner === playerNumber;
      const permitted = policy.mayObserve(actor);
      if (!owned && !permitted) continue;
      const visibility = owned ? "owned" : "visible";
      const projection = this.projectActor(actor, actorId, relation, visibility, tick, owned);
      projectedActors.push(projection);
      liveById.set(actorId, actor);
      if (!owned) this.remember(projection, tick);
      if (owned || visibility === "visible") {
        const catalogEntry = this.projectCatalogEntry(
          actor,
          projection.effectiveLevel.status === "known" ? projection.effectiveLevel.value : 1
        );
        if (catalogEntry) catalogEntries.set(catalogEntry.capabilityId, catalogEntry);
      }
    }

    this.projectAvailableCatalogEntries(playerNumber, catalogEntries);

    const permittedTopology = this.permittedTopology(projectedActors, liveById);
    const accessGraph = this.accessGraphAdapter.advanceGraph(tick, this.knowledgeRevision, permittedTopology);
    projectedActors = projectedActors.map((actor) => {
      const liveActor = liveById.get(actor.actorId);
      if (!liveActor) return actor;
      const nodeId = this.accessGraphAdapter.resolveNodeId(
        getGameObjectCurrentTile(liveActor),
        actor.capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain)
      );
      return { ...actor, accessNodeId: nodeId ? knownValue(nodeId, tick) : unknownValue("query_pending") };
    });

    const visibleIds = new Set(projectedActors.map((actor) => actor.actorId));
    const rememberedActors = this.projectRememberedContacts(visibleIds, tick);
    const actors = [...projectedActors, ...rememberedActors];
    const accessProducts = this.projectAccessProducts(actors, liveById, tick);
    const effects = this.projectPermittedZones(policy, tick);
    const map = this.projectMap(actors, liveById, tick, accessGraph, permittedTopology);
    const resources = Object.values(ResourceType)
      .sort()
      .map((resourceType) => {
        const deliveredIncome = this.getDeliveredIncomePerMinute?.(resourceType);
        return {
          resourceType,
          stockpile: this.player.getResources()[resourceType] ?? 0,
          reservedUnspent: 0,
          obligationsDue: 0,
          deliveredIncomePerMinute:
            deliveredIncome !== undefined && Number.isFinite(deliveredIncome)
              ? knownValue(Math.max(0, deliveredIncome), tick)
              : unknownValue("not_supported")
        };
      });

    return {
      observation: {
        schemaVersion: 1,
        generation,
        tick,
        playerNumber,
        faction: this.player.factionType!,
        actors,
        resources,
        accessProducts,
        effects,
        modeGoals: this.projectModeGoals(actors),
        researchCandidates: this.projectResearchCandidates(projectedActors, liveById),
        threatSummary: this.projectThreatSummary(actors, tick),
        map
      },
      catalog: {
        schemaVersion: 1,
        generation,
        entries: [...catalogEntries.values()].sort((left, right) =>
          left.capabilityId.localeCompare(right.capabilityId)
        ),
        unsupported: []
      }
    };
  }

  /** Projects only runtime-legal owned research; unavailable prerequisites do not become AI wishes. */
  private projectResearchCandidates(
    actors: readonly AiObservedActorV1[],
    liveById: ReadonlyMap<ActorId, GameObject>
  ): AiObservationV1["researchCandidates"] {
    const candidates: AiObservationV1["researchCandidates"][number][] = [];
    for (const observed of actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned")) {
      const actor = liveById.get(observed.actorId);
      const research = actor ? getActorComponent(actor, ResearchComponent) : undefined;
      if (!research || research.isResearching) continue;
      for (const researchType of [...research.availableResearch].sort()) {
        if (!research.canStartResearch(researchType).canStart) continue;
        const definition = researchDefinitions[researchType];
        if (!definition || (!definition.upgradesUnit && !definition.unlocksSpell)) continue;
        candidates.push({
          producerId: observed.actorId,
          researchType,
          cost: { ...definition.cost },
          durationTicks: millisecondsToSimulationTicks(definition.researchTime),
          refundPermille: Math.max(0, Math.min(1000, Math.round(definition.refundFactor * 1000))),
          benefit: definition.upgradesUnit
            ? {
                kind: "unit_level",
                targetObjectName: definition.upgradesUnit.unitType,
                targetLevel: definition.upgradesUnit.targetLevel,
                spellType: null
              }
            : { kind: "spell", targetObjectName: null, targetLevel: null, spellType: definition.unlocksSpell ?? null }
        });
      }
    }
    return candidates.sort(
      (left, right) =>
        left.producerId.localeCompare(right.producerId) || left.researchType.localeCompare(right.researchType)
    );
  }

  private isEligibleActor(actor: GameObject): boolean {
    const health = getActorComponent(actor, HealthComponent);
    return !health?.killed;
  }

  private projectActor(
    actor: GameObject,
    actorId: ActorId,
    relation: AiObservedActorV1["relation"],
    visibility: AiObservedActorV1["visibility"],
    tick: number,
    owned: boolean
  ): AiObservedActorV1 {
    const level = getResearchedLevelForActor(actor) ?? 1;
    const definition = getPwActorDefinition(actor.name, level);
    const position = getGameObjectLogicalTransform(actor);
    const queue = getActorComponent(actor, QueueComponent);
    const source = getActorComponent(actor, ResourceSourceComponent);
    const drain = getActorComponent(actor, ResourceDrainComponent);
    const health = getActorComponent(actor, HealthComponent);
    const attack = getActorComponent(actor, AttackComponent);
    const healing = getActorComponent(actor, HealingComponent);
    const spell = getActorComponent(actor, SpellComponent);
    const statusEffects = getActorComponent(actor, StatusEffectComponent);
    const constructionSite = getActorComponent(actor, ConstructionSiteComponent);
    const capabilities = this.projectActorCapabilities(actor.name as ObjectNames, definition, level);
    const logicalPosition = position ? knownValue({ ...position }, tick) : unknownValue("not_observed");
    const accessNode = this.accessGraphAdapter.resolveNodeId(
      getGameObjectCurrentTile(actor),
      capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain)
    );
    const accessNodeId = accessNode ? knownValue(accessNode, tick) : unknownValue("query_pending");
    const containable = getActorComponent(actor, ContainableComponent);
    const container = getActorComponent(actor, ContainerComponent);
    const pawnAi = getActorComponent(actor, PawnAiController);
    const currentOrder = pawnAi?.blackboard.getCurrentOrder();
    const orderTarget = currentOrder?.data.targetGameObject;
    const orderTargetId = orderTarget
      ? (getActorComponent(orderTarget, IdComponent)?.id ?? null)
      : (currentOrder?.data.targetGameObjectId ?? null);
    const containerOwner = containable?.getContainerOwner();
    const containerOwnerId =
      owned && containerOwner ? (getActorComponent(containerOwner, IdComponent)?.id ?? null) : null;
    const containerState =
      container && owned
        ? knownValue(
            {
              capacity: container.containerDefinition.capacity,
              passengerIds: container
                .getContainedGameObjects()
                .map((passenger) => getActorComponent(passenger, IdComponent)?.id)
                .filter((id): id is ActorId => id !== undefined)
                .sort(),
              pendingPassengerIds: container
                .getPendingBoarders()
                .map((passenger) => getActorComponent(passenger, IdComponent)?.id)
                .filter((id): id is ActorId => id !== undefined)
                .sort(),
              mobileDomains: capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain)
            },
            tick
          )
        : container
          ? unknownValue(owned ? "not_supported" : "not_observed")
          : undefined;
    return {
      actorId,
      objectName: actor.name as ObjectNames,
      owner: getActorComponent(actor, OwnerComponent)?.getOwner() ?? null,
      relation,
      visibility,
      evidenceId: `evidence:contact:${actorId}` as const,
      observedTick: tick,
      logicalPosition,
      accessNodeId,
      effectiveLevel: knownValue(level, tick),
      capabilities,
      queue:
        owned && queue
          ? knownValue(
              {
                capacity: queue.queueDefinition.queueCount * queue.queueDefinition.capacityPerQueue,
                occupied: queue.allItems.length,
                itemIds: queue.allItems.map((item, index) => `${actorId}:${index}:${item.type}`).sort()
              },
              tick
            )
          : unknownValue(owned ? "not_supported" : "not_observed"),
      cost: definition?.components?.productionCost
        ? knownValue({ ...definition.components.productionCost.resources }, tick)
        : unknownValue("not_supported"),
      housingCost:
        definition?.components?.housingCost?.housingNeeded === undefined
          ? unknownValue("not_supported")
          : knownValue(definition.components.housingCost.housingNeeded, tick),
      housingCapacity:
        definition?.components?.housing?.housingCapacity === undefined
          ? unknownValue("not_supported")
          : knownValue(definition.components.housing.housingCapacity, tick),
      healthPermille:
        health && (owned || visibility === "visible")
          ? knownValue(
              Math.max(
                0,
                Math.min(
                  1000,
                  Math.floor(
                    (health.healthComponentData.health / Math.max(1, health.healthDefinition.maxHealth)) * 1000
                  )
                )
              ),
              tick
            )
          : unknownValue(owned ? "not_supported" : "not_observed"),
      resourceState: source
        ? knownValue(
            {
              resourceType: source.getResourceType(),
              available: knownValue(source.getCurrentResources(), tick),
              carried: unknownValue("not_supported"),
              growthReadyTick: unknownValue("not_supported"),
              serviceCapacity: knownValue(source.getMaxGatherers() ?? Number.MAX_SAFE_INTEGER, tick)
            },
            tick
          )
        : drain && owned
          ? knownValue(
              {
                resourceType: drain.getResourceTypes()[0] ?? ResourceType.Food,
                available: unknownValue("not_supported"),
                carried: unknownValue("not_supported"),
                growthReadyTick: unknownValue("not_supported"),
                serviceCapacity: knownValue(drain.canDropOffResources() ? 1 : 0, tick)
              },
              tick
            )
          : unknownValue(owned ? "not_supported" : "not_observed"),
      ...(owned && constructionSite
        ? { constructionProgress: knownValue(constructionSite.progressPercentage, tick) }
        : {}),
      activeEffectIds:
        statusEffects
          ?.getActiveEffects()
          .map((effect) => `status:${effect.type}`)
          .sort() ?? [],
      activeOrder:
        owned && pawnAi
          ? knownValue(
              currentOrder
                ? {
                    orderType: currentOrder.orderType,
                    targetActorId: orderTargetId
                  }
                : null,
              tick
            )
          : unknownValue(owned ? "not_supported" : "not_observed"),
      combatProfile:
        health && (owned || visibility === "visible")
          ? knownValue(
              {
                maxHealth: health.healthDefinition.maxHealth,
                maxArmour: health.healthDefinition.maxArmour ?? 0,
                passiveRegenerationPerSecond: definition?.components?.healthRegeneration?.regenerateHealthRate ?? 0,
                armourPermille: Math.max(
                  0,
                  Math.min(
                    1000,
                    Math.floor(
                      (health.healthComponentData.armour / Math.max(1, health.healthDefinition.maxArmour ?? 0)) * 1000
                    )
                  )
                ),
                attacks: (attack?.getAttacks() ?? definition?.components?.attack?.attacks ?? []).map((entry) => ({
                  damage: entry.damage,
                  cooldownTicks: millisecondsToSimulationTicks(entry.cooldown),
                  remainingCooldownTicks:
                    owned && attack ? millisecondsToSimulationTicks(attack.remainingCooldown) : null,
                  range: entry.range,
                  minRange: entry.minRange,
                  highGroundRangeBonus: entry.highGroundRangeBonus ?? 0,
                  impactDelayTicks: millisecondsToSimulationTicks(entry.delays.hit),
                  areaRadius: entry.meleeAoe?.range ?? 0,
                  targetDomains: entry.canTargetAir
                    ? (["ground", "water", "air"] as const)
                    : (["ground", "water"] as const)
                })),
                healing:
                  healing && owned
                    ? {
                        amount: healing.healingDefinition.healPerCooldown,
                        cooldownTicks: millisecondsToSimulationTicks(healing.healingDefinition.cooldown),
                        remainingCooldownTicks: millisecondsToSimulationTicks(healing.remainingCooldown),
                        range: healing.healingDefinition.range
                      }
                    : null,
                spells:
                  spell && owned
                    ? spell.availableSpells
                        .map((spellType) => {
                          const data = spellDefinitions[spellType];
                          if (!data) return undefined;
                          return {
                            spellType,
                            ready: spell.canCastSpell(spellType),
                            researched: spell.isSpellResearched(spellType),
                            autocast: spell.isAutocastEnabled(spellType),
                            range: data.range,
                            areaRadius: data.aoeRadius,
                            targetAllies: data.targetAllies,
                            targetEnemies: data.targetEnemies,
                            targetSelf: data.targetSelf,
                            targetDomains: (data.targetDomains ?? ["land", "water", "air"])
                              .map((domain): AiDomainV1 => (domain === "land" ? "ground" : domain))
                              .filter(uniqueDomain),
                            instantDamage: data.instantDamage ?? 0,
                            periodicDamage:
                              Math.max(0, data.dotDamage ?? 0) *
                              Math.max(1, Math.floor((data.dotDuration ?? 0) / Math.max(1, data.dotTickInterval ?? 1))),
                            instantHeal: data.instantHeal ?? 0,
                            periodicHeal:
                              Math.max(0, data.hotHeal ?? 0) *
                              Math.max(1, Math.floor((data.hotDuration ?? 0) / Math.max(1, data.hotTickInterval ?? 1))),
                            stunTicks: millisecondsToSimulationTicks(data.stunDuration ?? 0),
                            slowTicks: millisecondsToSimulationTicks(data.slowDuration ?? 0),
                            zoneDurationTicks: millisecondsToSimulationTicks(data.persistentZone?.duration ?? 0),
                            summons: data.spawnPrefab !== undefined,
                            summonDurationTicks: data.spawnPrefab
                              ? data.spawnPrefab.duration === undefined
                                ? null
                                : millisecondsToSimulationTicks(data.spawnPrefab.duration)
                              : null
                          };
                        })
                        .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
                        .sort((left, right) => left.spellType.localeCompare(right.spellType))
                    : [],
                statuses: (statusEffects?.getActiveEffects() ?? [])
                  .map((effect) => ({
                    type: effect.type,
                    remainingTicks: millisecondsToSimulationTicks(effect.remainingTime),
                    movementSpeedPermille: Math.max(
                      100,
                      Math.min(2000, Math.floor((effect.movementSpeedModifier ?? 1) * 1000))
                    )
                  }))
                  .sort((left, right) => left.type.localeCompare(right.type))
              },
              tick
            )
          : unknownValue(owned ? "not_supported" : "not_observed"),
      ...(owned ? { mainBuilding: knownValue(definition?.meta?.isMainBuilding === true, tick) } : {}),
      containedInActorId: containerOwnerId,
      ...(containerState ? { containerState } : {})
    };
  }

  private projectActorCapabilities(
    objectName: ObjectNames,
    definition: ReturnType<typeof getPwActorDefinition>,
    level: number
  ): AiObservedActorV1["capabilities"] {
    if (!definition) return [];
    const families = capabilityFamilies(definition);
    const domains = movementDomains(definition);
    const supportedTargetDomains = targetDomains(definition);
    return families.map((family) => ({
      id: `${objectName}:${family}:${level}`,
      family,
      level,
      domains,
      targetDomains: supportedTargetDomains,
      capacity: knownValue(definition.components?.container?.capacity ?? 0, 0)
    }));
  }

  private projectCatalogEntry(actor: GameObject, level: number): AiCapabilityCatalogEntryV1 | undefined {
    const objectName = actor.name as ObjectNames;
    const definition = getPwActorDefinition(objectName, level);
    if (!definition) return undefined;
    return this.projectCatalogDefinition(
      objectName,
      definition,
      level,
      getActorComponent(actor, ResearchComponent)?.availableResearch ?? []
    );
  }

  /** Adds legal current-tech options from the runtime graph without copying balance data into AI code. */
  private projectAvailableCatalogEntries(
    playerNumber: number,
    catalogEntries: Map<string, AiCapabilityCatalogEntryV1>
  ): void {
    const techTree = getSceneService(this.scene, TechTreeService);
    if (!techTree) return;
    // Never enumerate the global graph here: that would expose another faction's
    // roster even when no opponent actor has been observed.
    for (const objectName of techTree.getFactionActorIds(this.player.factionType!)) {
      if (!techTree.isAvailable(playerNumber, objectName)) continue;
      const level = techTree.getResearchedLevelForUnit(playerNumber, objectName);
      const definition = getPwActorDefinition(objectName, level);
      if (!definition) continue;
      const entry = this.projectCatalogDefinition(
        objectName,
        definition,
        level,
        definition.components?.research?.availableResearch ?? []
      );
      catalogEntries.set(entry.capabilityId, entry);
    }
  }

  private projectCatalogDefinition(
    objectName: ObjectNames,
    definition: NonNullable<ReturnType<typeof getPwActorDefinition>>,
    level: number,
    researches: readonly ResearchType[]
  ): AiCapabilityCatalogEntryV1 {
    return {
      capabilityId: `${objectName}:level:${level}`,
      family: capabilityFamilies(definition).join("+") || "passive",
      sourceObjectName: objectName,
      effectiveLevel: level,
      movementDomains: movementDomains(definition),
      targetDomains: targetDomains(definition),
      produces: [...(definition.components?.production?.availableProduceActors ?? [])].sort(),
      constructs: definition.components?.builder
        ? [
            ...BuilderComponent.getFlatConstructableBuildings(definition.components.builder.constructableBuildings)
          ].sort()
        : [],
      researches: [...researches].sort(),
      gathers: normalizeGatherResourceTypes(definition.components?.gatherer?.resourceSourceGameObjectClasses),
      housingCapacity: definition.components?.housing?.housingCapacity ?? null,
      housingCost: definition.components?.housingCost?.housingNeeded ?? null,
      cargoCapacity: definition.components?.container?.capacity ?? null,
      constructionProfile: {
        resourceCost: { ...(definition.components?.productionCost?.resources ?? {}) },
        footprintRadiusTiles: Math.floor(
          ((definition.components?.representable?.width ?? 0) *
            (definition.components?.collider?.colliderFactorReduction || 1)) /
            (getSceneService(this.scene, TilemapComponent)?.tilemap?.tileWidth ?? TilemapComponent.tileWidth) /
            2
        ),
        visionRange: definition.components?.vision?.range ?? null,
        navigableHeight: definition.components?.navigable?.navigableHeight ?? null,
        enterHeight: definition.components?.navigable?.enterHeight ?? null,
        exitHeight: definition.components?.navigable?.exitHeight ?? null
      }
    };
  }

  private remember(actor: AiObservedActorV1, tick: number): void {
    if (actor.relation === "self") return;
    this.memory.set(actor.actorId, {
      actorId: actor.actorId,
      objectName: actor.objectName,
      owner: actor.owner,
      relation: actor.relation,
      evidenceId: actor.evidenceId,
      lastSeenTick: tick,
      confidencePermille: 1000,
      position: actor.logicalPosition.status === "known" ? { ...actor.logicalPosition.value } : null
    });
    this.trimRememberedContacts();
    this.knowledgeRevision += 1;
  }

  private projectRememberedContacts(visibleIds: ReadonlySet<ActorId>, tick: number): AiObservedActorV1[] {
    const remembered: AiObservedActorV1[] = [];
    for (const contact of this.memory.values()) {
      if (visibleIds.has(contact.actorId)) continue;
      const elapsed = Math.max(0, tick - contact.lastSeenTick);
      if (isRememberedContactExpired(contact.lastSeenTick, tick)) {
        this.memory.delete(contact.actorId);
        continue;
      }
      const confidencePermille = decayObservationConfidence(contact.confidencePermille, elapsed);
      this.memory.set(contact.actorId, { ...contact, confidencePermille });
      const position = contact.position
        ? knownValue({ ...contact.position }, contact.lastSeenTick)
        : unknownValue("not_observed");
      remembered.push({
        actorId: contact.actorId,
        objectName: contact.objectName,
        owner: contact.owner,
        relation: contact.relation,
        visibility: "last_seen",
        evidenceId: contact.evidenceId as AiObservedActorV1["evidenceId"],
        observedTick: contact.lastSeenTick,
        logicalPosition: position,
        accessNodeId: unknownValue("query_pending"),
        effectiveLevel: unknownValue("not_observed"),
        capabilities: [],
        queue: unknownValue("not_observed"),
        cost: unknownValue("not_observed"),
        housingCost: unknownValue("not_observed"),
        housingCapacity: unknownValue("not_observed"),
        resourceState: unknownValue("not_observed"),
        activeEffectIds: []
      });
    }
    return remembered
      .filter((actor) => actor.relation !== "self")
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
  }

  private projectAccessProducts(
    actors: readonly AiObservedActorV1[],
    liveById: ReadonlyMap<ActorId, GameObject>,
    tick: number
  ): AiObservedAccessProductV1[] {
    const owned = actors.filter((actor) => actor.visibility === "owned" && actor.accessNodeId.status === "known");
    const contacts = actors.filter(
      (actor) => actor.visibility === "visible" && actor.relation === "enemy" && actor.accessNodeId.status === "known"
    );
    const candidates = owned
      .flatMap((source) => contacts.map((target) => ({ source, target })))
      .sort((left, right) =>
        `${left.source.actorId}:${left.target.actorId}`.localeCompare(`${right.source.actorId}:${right.target.actorId}`)
      );
    if (candidates.length === 0) return [];
    const scheduled = selectBoundedObservationWork(
      candidates,
      this.queryContinuationCursor,
      MAX_ACCESS_PRODUCTS_PER_OBSERVATION
    );
    const selected = scheduled.selected;
    this.queryContinuationCursor = scheduled.nextCursor;
    if (selected.length > 0) this.invalidationDebt = Math.max(0, this.invalidationDebt - selected.length);
    return selected.map(({ source, target }) => this.projectAccessProduct(source, target, liveById, tick));
  }

  /** Produces bounded static/topology metadata without exposing hidden occupancy. */
  private projectMap(
    actors: readonly AiObservedActorV1[],
    liveById: ReadonlyMap<ActorId, GameObject>,
    tick: number,
    accessGraph: NonNullable<AiObservationV1["map"]>["accessGraph"],
    permittedTopology: {
      readonly blockedTileKeys: ReadonlySet<string>;
      readonly navigableTileKeys: ReadonlySet<string>;
    }
  ): NonNullable<AiObservationV1["map"]> {
    const tilemap = getSceneService(this.scene, TilemapComponent)?.tilemap;
    const navigation = getSceneService(this.scene, NavigationService);
    const ownedNodes = actors
      .filter((actor) => actor.visibility === "owned" && actor.accessNodeId.status === "known")
      .map((actor) => (actor.accessNodeId.status === "known" ? actor.accessNodeId.value : null))
      .filter((node): node is `access:${string}` => node !== null)
      .sort();
    const dynamicObstacleActorIds = actors
      .filter((actor) => actor.visibility !== "last_seen")
      .filter((actor) => {
        const liveActor = liveById.get(actor.actorId);
        return liveActor
          ? getActorComponent(liveActor, ColliderComponent)?.colliderDefinition?.enabled === true
          : false;
      })
      .map((actor) => actor.actorId)
      .sort();
    const scoutCoverageAccessNodeIds = [
      ...new Set(
        actors
          .filter((actor) => actor.visibility === "owned" && actor.accessNodeId.status === "known")
          .filter((actor) => {
            const liveActor = liveById.get(actor.actorId);
            return liveActor ? getActorComponent(liveActor, VisionComponent) !== undefined : false;
          })
          .map((actor) => (actor.accessNodeId.status === "known" ? actor.accessNodeId.value : null))
          .filter((node): node is `access:${string}` => node !== null)
      )
    ].sort();
    const constructionCells: Array<NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number]> = [];
    const anchors = actors
      .filter(
        (actor) => actor.visibility === "owned" && actor.mainBuilding?.status === "known" && actor.mainBuilding.value
      )
      .filter((actor) => actor.logicalPosition.status === "known")
      .map((actor) =>
        actor.logicalPosition.status === "known"
          ? {
              ...actor.logicalPosition.value,
              x: Math.round(actor.logicalPosition.value.x),
              y: Math.round(actor.logicalPosition.value.y)
            }
          : null
      )
      .filter((position): position is Vector3Simple => position !== null)
      .sort((left, right) => left.y - right.y || left.x - right.x)
      .slice(0, 4);
    const included = new Set<string>();
    if (tilemap && navigation) {
      anchorCells: for (const anchor of anchors) {
        for (let y = Math.max(0, anchor.y - 12); y <= Math.min(tilemap.height - 1, anchor.y + 12); y += 1) {
          for (let x = Math.max(0, anchor.x - 12); x <= Math.min(tilemap.width - 1, anchor.x + 12); x += 1) {
            if (constructionCells.length >= 2_048) break anchorCells;
            const tileKey = `${x},${y}`;
            if (included.has(tileKey)) continue;
            included.add(tileKey);
            const observedNavigable = permittedTopology.navigableTileKeys.has(tileKey);
            const observedBlocked = permittedTopology.blockedTileKeys.has(tileKey);
            constructionCells.push({
              tileKey,
              position: { x, y, z: 0 },
              groundPassable: !observedBlocked && navigation.isTileGridWithoutBlockingObjectsNavigable({ x, y }),
              waterPassable: navigation.isTileNavigable({ x, y }, MovementTerrainType.Water),
              elevation: observedNavigable ? (navigation.getNavigableHeightAtTile({ x, y }) ?? 0) : 0,
              observedBlocked
            });
          }
        }
      }
    }
    return {
      bounds: tilemap
        ? knownValue({ width: tilemap.width, height: tilemap.height }, tick)
        : unknownValue("not_supported"),
      // Tilemap content is immutable for a loaded match; topology changes belong
      // to the independently versioned dynamic-query stream.
      staticRevision: tilemap ? 1 : 0,
      // A frontier is an admitted static region outside currently covered vision, not
      // merely the AI's own node. Dynamic unknowns remain absent from this fair input.
      frontierAccessNodeIds: (accessGraph?.nodes ?? [])
        .filter((candidate) => candidate.knowledge === "known_static" && !ownedNodes.includes(candidate.nodeId))
        .map((candidate) => candidate.nodeId)
        .sort(),
      scoutCoverageAccessNodeIds,
      dynamicObstacleActorIds,
      regionGeneration: {
        generation: accessGraph?.generation ?? this.requestedGeneration,
        status: accessGraph?.status === "ready" ? "ready" : tilemap ? "not_ready" : "service_failed",
        continuationCursor: accessGraph?.continuationCursor ?? this.queryContinuationCursor
      },
      constructionCells,
      ...(accessGraph ? { accessGraph } : {})
    };
  }

  /** Hashes only owned/visible topology actors so hidden movement cannot invalidate the AI graph. */
  private permittedTopology(
    actors: readonly AiObservedActorV1[],
    liveById: ReadonlyMap<ActorId, GameObject>
  ): {
    readonly revision: number;
    readonly blockedTileKeys: ReadonlySet<string>;
    readonly navigableTileKeys: ReadonlySet<string>;
  } {
    const tilemap = getSceneService(this.scene, TilemapComponent)?.tilemap;
    const blockedTileKeys = new Set<string>();
    const navigableTileKeys = new Set<string>();
    const input = actors
      .filter((actor) => actor.visibility !== "last_seen")
      .flatMap((actor) => {
        const liveActor = liveById.get(actor.actorId);
        if (!liveActor) return [];
        const collider = getActorComponent(liveActor, ColliderComponent)?.colliderDefinition?.enabled === true;
        const navigableComponent = getActorComponent(liveActor, NavigableComponent);
        const navigable = navigableComponent !== undefined;
        if (!collider && !navigable) return [];
        const tile = getGameObjectCurrentTile(liveActor);
        if (tilemap) {
          for (const occupiedTile of getTileCoordsUnderObject(tilemap, liveActor)) {
            const key = `${occupiedTile.x},${occupiedTile.y}`;
            if (collider) blockedTileKeys.add(key);
            if (navigable) navigableTileKeys.add(key);
          }
        }
        const pathSignature = navigableComponent
          ? (["top", "bottom", "left", "right", "topLeft", "topRight", "bottomLeft", "bottomRight"] as const)
              .map((direction) => {
                const port = navigableComponent.getDirectionPort(direction);
                return `${direction}:${port?.enterHeight ?? "x"}:${port?.exitHeight ?? "x"}`;
              })
              .join(",")
          : "";
        return tile
          ? [`${actor.actorId}:${tile.x}:${tile.y}:${collider ? 1 : 0}:${navigable ? 1 : 0}:${pathSignature}`]
          : [];
      })
      .sort()
      .join("|");
    let hash = 0x811c9dc5;
    const source = `${tilemap?.width ?? 0}:${tilemap?.height ?? 0}:${input}`;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return { revision: hash >>> 0, blockedTileKeys, navigableTileKeys };
  }

  private projectThreatSummary(actors: readonly AiObservedActorV1[], tick: number): AiObservationV1["threatSummary"] {
    const enemies = actors.filter((actor) => actor.relation === "enemy");
    return {
      observedTick: tick,
      visibleEnemyActorIds: enemies
        .filter((actor) => actor.visibility === "visible")
        .map((actor) => actor.actorId)
        .sort(),
      rememberedEnemyActorIds: enemies
        .filter((actor) => actor.visibility === "last_seen")
        .map((actor) => actor.actorId)
        .sort(),
      observedCapabilityFamilies: enemies
        .filter((actor) => actor.visibility === "visible")
        .flatMap((actor) => actor.capabilities.map((capability) => capability.family))
        .filter((family, index, values) => values.indexOf(family) === index)
        .sort()
    };
  }

  /** Projects public mode configuration and locally observable status; mode resolution stays authoritative. */
  private projectModeGoals(actors: readonly AiObservedActorV1[]): AiObservationV1["modeGoals"] {
    const data = getGameModeFromScene<ProbableWaffleGameMode>(this.scene).data;
    const selfFailed = this.player.playerController.data.leftOrKilled === true;
    const selfActors = actors
      .filter((actor) => actor.relation === "self")
      .map((actor) => actor.actorId)
      .sort();
    const visibleEnemies = actors
      .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
      .map((actor) => actor.actorId)
      .sort();
    const enemyNodes = actors
      .filter(
        (actor) => actor.relation === "enemy" && actor.visibility === "visible" && actor.accessNodeId.status === "known"
      )
      .map((actor) => (actor.accessNodeId.status === "known" ? actor.accessNodeId.value : undefined))
      .filter((node): node is NonNullable<typeof node> => node !== undefined)
      .sort();
    const goals: AiObservationV1["modeGoals"][number][] = [];
    if (data.winConditions.noEnemyPlayersLeft === true) {
      goals.push({
        id: "mode:win:no_enemy_players_left",
        kind: "destroy",
        owner: this.player.playerNumber!,
        targetActorIds: visibleEnemies,
        targetAccessNodeIds: enemyNodes,
        state: selfFailed ? "failed" : "active"
      });
    }
    if (
      data.loseConditions.allActorsMustBeEliminated === true ||
      data.loseConditions.allBuildingsMustBeEliminated === true
    ) {
      goals.push({
        id: "mode:survive:owned_assets",
        kind: "protect",
        owner: this.player.playerNumber!,
        targetActorIds: selfActors,
        targetAccessNodeIds: [],
        state: selfFailed ? "failed" : "active"
      });
    }
    if (data.tieConditions.maximumTimeLimitInMinutes !== undefined) {
      goals.push({
        id: "mode:tie:time_limit",
        kind: "survive",
        owner: this.player.playerNumber!,
        targetActorIds: [],
        targetAccessNodeIds: [],
        state: selfFailed ? "failed" : "active"
      });
    }
    return goals.sort((left, right) => left.id.localeCompare(right.id));
  }

  private countUnknownFacts(observation: AiObservationV1 | undefined): number {
    if (!observation) return 0;
    const actorUnknownFacts = observation.actors.reduce(
      (count, actor) =>
        count +
        [
          actor.logicalPosition,
          actor.accessNodeId,
          actor.effectiveLevel,
          actor.queue,
          actor.cost,
          actor.housingCost,
          actor.housingCapacity,
          actor.resourceState
        ].filter((fact) => fact.status === "unknown").length,
      0
    );
    return actorUnknownFacts + (observation.map?.bounds.status === "unknown" ? 1 : 0);
  }

  /** Projects only self-owned or explicitly scripted-visible zones, never hidden enemy effects. */
  /** Stage 13 additionally admits an enemy/allied zone only while ordinary owned vision covers its tile. */
  private projectPermittedZones(policy: AiObservationVisibilityPolicy, tick: number): AiObservationV1["effects"] {
    const zones = getSceneService(this.scene, AoeZoneManager)?.getData() ?? [];
    return zones
      .map((zone) => ({
        zone,
        tilePosition: IsoHelper.isometricWorldToTileXY(this.scene, zone.worldPosition.x, zone.worldPosition.y)
      }))
      .filter(
        ({ zone, tilePosition }) =>
          zone.sourcePlayerId === this.player.playerNumber || policy.mayObserveTile(tilePosition)
      )
      .map(({ zone, tilePosition }) => {
        const relation = getPlayerRelation(this.scene, this.player.playerNumber, zone.sourcePlayerId);
        const friendlySource = relation === "self" || relation === "ally";
        const effect = zone.effectWhileInside;
        const beneficialEffect =
          (effect?.healPerTick ?? 0) > 0 || (effect?.instantHeal ?? 0) > 0 || (effect?.movementSpeedModifier ?? 1) > 1;
        const harmfulEffect =
          (effect?.damagePerTick ?? 0) > 0 ||
          (effect?.instantDamage ?? 0) > 0 ||
          (effect?.movementSpeedModifier ?? 1) < 1;
        const influencesSelf = friendlySource ? zone.affectsAllies : zone.affectsEnemies;
        const influence = !influencesSelf
          ? "mixed"
          : harmfulEffect && beneficialEffect
            ? "mixed"
            : harmfulEffect
              ? "harmful"
              : beneficialEffect
                ? "beneficial"
                : "mixed";
        return {
          effectId: `zone:${zone.id}`,
          owner: zone.sourcePlayerId ?? null,
          relation,
          position: { x: tilePosition.x, y: tilePosition.y, z: 0 },
          targetDomains: ["ground", "water", "air"],
          expiresAt: knownValue(Math.max(tick, tick + millisecondsToSimulationTicks(zone.remainingTime)), tick),
          radius: zone.radius,
          influence
        } satisfies AiObservedEffectV1;
      })
      .sort((left, right) => left.effectId.localeCompare(right.effectId));
  }

  private projectAccessProduct(
    source: AiObservedActorV1,
    target: AiObservedActorV1,
    liveById: ReadonlyMap<ActorId, GameObject>,
    tick: number
  ): AiObservedAccessProductV1 {
    const sourceNode = source.accessNodeId.status === "known" ? source.accessNodeId.value : undefined;
    const targetNode = target.accessNodeId.status === "known" ? target.accessNodeId.value : undefined;
    const queryId = `query:access:${source.actorId}:${target.actorId}`;
    const sourceActor = liveById.get(source.actorId);
    const targetActor = liveById.get(target.actorId);
    const navigation = getSceneService(this.scene, NavigationService);
    let status: AiObservedAccessProductV1["status"] = "not_ready";
    if (!sourceNode || !targetNode || !sourceActor || !targetActor) {
      status = "unknown";
    } else if (!navigation) {
      status = "service_failed";
    } else {
      const sourceTile = getGameObjectCurrentTile(sourceActor);
      const targetTile = getGameObjectCurrentTile(targetActor);
      if (!sourceTile || !targetTile) {
        status = "unknown";
      } else if (
        !canActorTraverseTile(sourceActor, navigation, sourceTile) ||
        !canActorTraverseTile(sourceActor, navigation, targetTile)
      ) {
        status = "blocked";
      }
    }
    return {
      queryId,
      revision: this.queryInputRevision,
      status,
      fromNodeId: sourceNode ?? ("access:unknown" as const),
      toNodeId: targetNode ?? ("access:unknown" as const),
      domains: source.capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain),
      updatedTick: tick
    };
  }

  private destroy(): void {
    if (this.navigationInvalidationListener) {
      this.scene.events.off(NavigationService.UpdateNavigationEvent, this.navigationInvalidationListener);
      this.navigationInvalidationListener = undefined;
    }
  }

  private trimRememberedContacts(): void {
    const overflow = this.memory.size - MAX_REMEMBERED_CONTACTS;
    if (overflow <= 0) return;
    [...this.memory.values()]
      .sort((left, right) => left.lastSeenTick - right.lastSeenTick || left.actorId.localeCompare(right.actorId))
      .slice(0, overflow)
      .forEach((contact) => this.memory.delete(contact.actorId));
  }
}

function knownValue<T>(value: T, observedTick: number): AiKnownValueV1<T> {
  return { status: "known", value, observedTick };
}

/** A stale asynchronous request may observe results but may never publish them. */
export function isCurrentObservationGeneration(requestedGeneration: number, candidateGeneration: number): boolean {
  return requestedGeneration === candidateGeneration;
}

/** Applies bounded evidence decay without manufacturing a new independent sighting. */
export function decayObservationConfidence(confidencePermille: number, elapsedTicks: number): number {
  return Math.max(0, Math.min(1000, confidencePermille - Math.max(0, elapsedTicks) * MEMORY_DECAY_PER_TICK));
}

/** A last-seen hypothesis expires on the same logical-tick boundary after save/load. */
export function isRememberedContactExpired(lastSeenTick: number, currentTick: number): boolean {
  return Math.max(0, currentTick - lastSeenTick) > CONTACT_MEMORY_TICKS;
}

/** Deterministic bounded round-robin selection for optional observation work. */
export function selectBoundedObservationWork<T>(
  candidates: readonly T[],
  continuationCursor: number,
  maximum: number
): { readonly selected: readonly T[]; readonly nextCursor: number } {
  if (candidates.length === 0 || maximum <= 0) return { selected: [], nextCursor: 0 };
  const start = Math.max(0, continuationCursor) % candidates.length;
  const selected = Array.from(
    { length: Math.min(maximum, candidates.length) },
    (_, index) => candidates[(start + index) % candidates.length]!
  );
  return { selected, nextCursor: (start + selected.length) % candidates.length };
}

/** Caps invalidation storms without discarding the saved fair-work cursor. */
export function accumulateObservationInvalidationDebt(currentDebt: number): number {
  return Math.min(MAX_INVALIDATION_DEBT, Math.max(0, currentDebt) + 1);
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRememberedContact(contact: unknown): contact is RememberedContact {
  if (!isRecord(contact)) return false;
  const { actorId, objectName, owner, evidenceId, lastSeenTick, confidencePermille, relation, position } = contact;
  if (
    typeof actorId !== "string" ||
    typeof objectName !== "string" ||
    (owner !== null && (typeof owner !== "number" || !isNonNegativeInteger(owner))) ||
    typeof evidenceId !== "string" ||
    typeof lastSeenTick !== "number" ||
    !isNonNegativeInteger(lastSeenTick) ||
    typeof confidencePermille !== "number" ||
    !isNonNegativeInteger(confidencePermille) ||
    confidencePermille > 1000 ||
    typeof relation !== "string" ||
    !["self", "ally", "neutral", "enemy"].includes(relation)
  ) {
    return false;
  }
  return (
    position === null ||
    (isRecord(position) &&
      [position.x, position.y, position.z].every(
        (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)
      ))
  );
}

/** Normalizes persistence input so duplicate or malformed contacts cannot change a restored decision. */
export function normalizeAiObservationMemoryState(value: unknown): AiObservationMemoryStateData | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1) return undefined;
  const {
    generation,
    committedTick,
    knowledgeRevision,
    queryInputRevision,
    queryContinuationCursor,
    invalidationDebt
  } = value;
  const fields = [
    generation,
    committedTick,
    knowledgeRevision,
    queryInputRevision,
    queryContinuationCursor,
    invalidationDebt
  ];
  if (!fields.every((field) => typeof field === "number" && isNonNegativeInteger(field))) return undefined;
  if (!Array.isArray(value.contacts)) return undefined;

  const contactsById = new Map<ActorId, RememberedContact>();
  for (const contact of value.contacts) {
    if (!isValidRememberedContact(contact)) continue;
    const existing = contactsById.get(contact.actorId);
    if (
      !existing ||
      contact.lastSeenTick > existing.lastSeenTick ||
      (contact.lastSeenTick === existing.lastSeenTick && contact.confidencePermille > existing.confidencePermille)
    ) {
      contactsById.set(contact.actorId, cloneRememberedContact(contact));
    }
  }
  const contacts = [...contactsById.values()]
    .sort((left, right) => left.lastSeenTick - right.lastSeenTick || left.actorId.localeCompare(right.actorId))
    .slice(-MAX_REMEMBERED_CONTACTS)
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  return {
    schemaVersion: 1,
    generation: generation as number,
    committedTick: committedTick as number,
    knowledgeRevision: knowledgeRevision as number,
    queryInputRevision: queryInputRevision as number,
    queryContinuationCursor: queryContinuationCursor as number,
    invalidationDebt: Math.min(MAX_INVALIDATION_DEBT, invalidationDebt as number),
    contacts
  };
}

function cloneRememberedContact(contact: RememberedContact): RememberedContact {
  return {
    ...contact,
    position: contact.position ? { ...contact.position } : null
  };
}

function unknownValue(reason: "not_observed" | "not_supported" | "query_pending"): AiKnownValueV1<never> {
  return { status: "unknown", reason };
}

function compareByActorId(left: GameObject, right: GameObject): number {
  return (getActorComponent(left, IdComponent)?.id ?? "").localeCompare(
    getActorComponent(right, IdComponent)?.id ?? ""
  );
}

function movementDomains(definition: ReturnType<typeof getPwActorDefinition>): AiDomainV1[] {
  if (!definition) return [];
  if (definition.components?.flying) return ["air"];
  switch (definition.components?.translatable?.movementTerrainType) {
    case MovementTerrainType.Water:
      return ["water"];
    case MovementTerrainType.Amphibious:
      return ["ground", "water"];
    case MovementTerrainType.Air:
      return ["air"];
    default:
      return definition.components?.translatable || definition.components?.navigable ? ["ground"] : [];
  }
}

function targetDomains(definition: ReturnType<typeof getPwActorDefinition>): AiDomainV1[] {
  const attacks = definition?.components?.attack?.attacks ?? [];
  if (attacks.length === 0) return [];
  return attacks.some((attack) => attack.canTargetAir) ? ["ground", "water", "air"] : ["ground", "water"];
}

function capabilityFamilies(definition: ReturnType<typeof getPwActorDefinition>): string[] {
  if (!definition) return [];
  const components = definition.components ?? {};
  return [
    components.attack ? "attack" : null,
    components.healing ? "heal" : null,
    components.spell ? "spell" : null,
    components.gatherer ? "gather" : null,
    components.builder ? "build" : null,
    components.production ? "produce" : null,
    components.resourceDrain ? "drop_off" : null,
    components.container ? "transport" : null
  ].filter((family): family is string => family !== null);
}

/** Keeps runtime gather capabilities inside the protocol's finite resource domain. */
export function normalizeGatherResourceTypes(values: readonly string[] | undefined): ResourceType[] {
  const resourceTypes = new Set(Object.values(ResourceType));
  return (values ?? []).filter((value): value is ResourceType => resourceTypes.has(value as ResourceType)).sort();
}

function uniqueDomain(domain: AiDomainV1, index: number, values: readonly AiDomainV1[]): boolean {
  return values.indexOf(domain) === index;
}

/** Converts component millisecond timing to the simulation's fixed 20 Hz clock. */
function millisecondsToSimulationTicks(milliseconds: number): number {
  return Math.max(0, Math.ceil(milliseconds / SimulationTickService.TICK_INTERVAL_MS));
}
