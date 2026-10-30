import Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import {
  ResourceType,
  type AiObservationMemoryStateData,
  type ProbableWafflePlayer
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  canonicalizeAiObservationV1,
  type AiCapabilityCatalogEntryV1,
  type AiCapabilityCatalogV1,
  type AiObservedAccessProductV1,
  type AiObservedActorV1,
  type AiObservationV1
} from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import { isSceneActive } from "../../../data/game-object-helper";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { NavigationService } from "../../../world/services/navigation.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AiObservationVisibilityPolicy } from "./ai-observation-visibility-policy";
import { AiAccessGraphAdapter } from "./ai-access-graph.adapter";
import type { AiObservationDebugSnapshot } from "./ai-observation-debug-snapshot";
import { projectAiObservedActor } from "./ai-observation-actor-projector";
import { projectCatalogEntry, projectAvailableCatalogEntries } from "./ai-observation-catalog";
import { permittedAiObservationTopology, projectAiObservationMap } from "./ai-observation-map";
import { compareAccessProductCandidates, projectAccessProduct } from "./ai-observation-access-product";
import {
  countUnknownFacts,
  projectModeGoals,
  projectPermittedZones,
  projectResearchCandidates,
  projectThreatSummary
} from "./ai-observation-context";
import {
  cloneRememberedContact,
  normalizeAiObservationMemoryState,
  projectRememberedContacts,
  trimRememberedContacts,
  type RememberedContact
} from "./ai-observation-memory";
import {
  accumulateObservationInvalidationDebt,
  isCurrentObservationGeneration,
  selectBoundedObservationWork
} from "./ai-observation-work";
import { knownValue, uniqueDomain, unknownValue } from "./ai-observation-values";
import { projectAiProductionObligations } from "./ai-production-obligations";
import { beginAiResourceInputRead } from "./ai-resource-input-observation";
import {
  readAiResourceInputRead,
  rememberAiResourceInputRead
} from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-resource-input-observation";

const MAX_ACCESS_PRODUCTS_PER_OBSERVATION = 4;
const MAX_INVALIDATION_DEBT = 1024;

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
  private lastCommitErrorStage: string | null = null;
  private lastCommitErrorCode: string | null = null;
  private navigationInvalidationListener?: () => void;
  private ignoreNavigationChangesUntilCapture = false;
  private readonly accessGraphAdapter: AiAccessGraphAdapter;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly getDeliveredIncomePerMinute?: (resourceType: ResourceType) => number | undefined
  ) {
    this.accessGraphAdapter = new AiAccessGraphAdapter(scene);
    this.navigationInvalidationListener = () => {
      if (this.ignoreNavigationChangesUntilCapture) return;
      this.queryInputRevision += 1;
      this.invalidationDebt = accumulateObservationInvalidationDebt(this.invalidationDebt);
    };
    scene.events.on(NavigationService.UpdateNavigationEvent, this.navigationInvalidationListener);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Captures and atomically publishes the newest generation, rejecting late work by generation. */
  async refresh(tick: number): Promise<AiObservationV1 | undefined> {
    return this.refreshNow(tick);
  }

  /** Pure selection must capture and consume its input before the next simulation tick. */
  refreshNow(tick: number): AiObservationV1 | undefined {
    if (this.player.playerNumber === undefined || !this.player.factionType || !isSceneActive(this.scene)) {
      return this.latestObservation;
    }
    const generation = ++this.requestedGeneration;
    this.ignoreNavigationChangesUntilCapture = false;
    const policy = new AiObservationVisibilityPolicy(this.scene, this.player.playerNumber);
    const captureDiagnostics = { stage: "actor_index" };
    try {
      const captured = this.capture(generation, tick, policy, captureDiagnostics);
      // This guard is deliberately after capture: a future async query implementation
      // may never publish an older snapshot over a newer decision boundary.
      if (!isCurrentObservationGeneration(this.requestedGeneration, generation) || !isSceneActive(this.scene)) {
        return this.latestObservation;
      }
      this.latestObservation = canonicalizeAiObservationV1(captured.observation);
      const resourceRead = readAiResourceInputRead(captured.observation);
      if (resourceRead) rememberAiResourceInputRead(this.latestObservation, resourceRead);
      this.latestCatalog = captured.catalog;
      this.committedGeneration = generation;
      this.committedTick = tick;
      this.lastCommitError = null;
      this.lastCommitErrorStage = null;
      this.lastCommitErrorCode = null;
      return this.latestObservation;
    } catch (error) {
      this.lastCommitError = error instanceof Error ? error.message : String(error);
      this.lastCommitErrorStage = captureDiagnostics.stage;
      this.lastCommitErrorCode = safeAiCaptureErrorCode(error);
      return this.latestObservation;
    }
  }

  getObservation(): AiObservationV1 | undefined {
    return this.latestObservation;
  }

  getCapabilityCatalog(): AiCapabilityCatalogV1 | undefined {
    return this.latestCatalog;
  }

  /** Returns only a bounded internal capture phase, never a live-world error detail. */
  getLastCommitErrorStage(): string | null {
    return this.lastCommitErrorStage;
  }

  /** Returns a bounded error category without projecting exception text into AI telemetry. */
  getLastCommitErrorCode(): string | null {
    return this.lastCommitErrorCode;
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
      unknownFactCount: countUnknownFacts(this.latestObservation),
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
    // Save loading can finish registering restored navigable actors after the controller state is applied.
    // The first capture reads the complete live topology, so those load-only notifications are redundant.
    this.ignoreNavigationChangesUntilCapture = true;
    this.memory.clear();
    for (const contact of normalized.contacts) this.memory.set(contact.actorId, cloneRememberedContact(contact));
  }

  private capture(
    generation: number,
    tick: number,
    policy: AiObservationVisibilityPolicy,
    diagnostics: { stage: string }
  ): { observation: AiObservationV1; catalog: AiCapabilityCatalogV1 } {
    const playerNumber = this.player.playerNumber!;
    const index = getSceneService(this.scene, ActorIndexSystem);
    const liveActors = (index?.getAllIdActors() ?? [])
      .filter((actor) => this.isEligibleActor(actor))
      .sort(compareByActorId);
    let projectedActors: AiObservedActorV1[] = [];
    const liveById = new Map<ActorId, Phaser.GameObjects.GameObject>();
    const catalogEntries = new Map<string, AiCapabilityCatalogEntryV1>();

    for (const actor of liveActors) {
      diagnostics.stage = "actor_projection";
      const actorId = getActorComponent(actor, IdComponent)?.id;
      if (!actorId) continue;
      const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
      const relation = policy.relationTo(actor);
      const owned = owner === playerNumber;
      const permitted = policy.mayObserve(actor);
      if (!owned && !permitted) continue;
      const visibility = owned ? "owned" : "visible";
      const projection = projectAiObservedActor(
        actor,
        actorId,
        relation,
        visibility,
        tick,
        owned,
        this.accessGraphAdapter
      );
      projectedActors.push(projection);
      liveById.set(actorId, actor);
      if (!owned) this.remember(projection, tick);
      if (owned || visibility === "visible") {
        const catalogEntry = projectCatalogEntry(
          actor,
          projection.effectiveLevel.status === "known" ? projection.effectiveLevel.value : 1,
          this.scene
        );
        if (catalogEntry) catalogEntries.set(catalogEntry.capabilityId, catalogEntry);
      }
    }

    diagnostics.stage = "catalog";
    projectAvailableCatalogEntries(this.scene, this.player, playerNumber, catalogEntries);

    diagnostics.stage = "permitted_topology";
    const permittedTopology = permittedAiObservationTopology(this.scene, projectedActors, liveById);
    diagnostics.stage = "access_graph";
    const accessGraph = this.accessGraphAdapter.advanceGraph(tick, this.knowledgeRevision, permittedTopology);
    diagnostics.stage = "access_node_projection";
    projectedActors = projectedActors.map((actor) => {
      if (actor.logicalPosition.status !== "known") return actor;
      const nodeId = this.accessGraphAdapter.resolveNodeId(
        actor.logicalPosition.value,
        actor.capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain)
      );
      return { ...actor, accessNodeId: nodeId ? knownValue(nodeId, tick) : unknownValue("query_pending") };
    });

    const visibleIds = new Set(projectedActors.map((actor) => actor.actorId));
    const memorySizeBeforeProjection = this.memory.size;
    const rememberedActors = projectRememberedContacts(this.memory, visibleIds, tick, (position) =>
      policy.mayObserveGroundTile(position)
    );
    this.knowledgeRevision += memorySizeBeforeProjection - this.memory.size;
    const actors = [...projectedActors, ...rememberedActors];
    diagnostics.stage = "access_products";
    const accessProducts = this.projectAccessProducts(actors, liveById, tick);
    diagnostics.stage = "effects";
    const effects = projectPermittedZones(this.scene, this.player, policy, tick);
    const ownedBuilderTypes = new Set(
      projectedActors.filter((actor) => actor.relation === "self").map((actor) => actor.objectName)
    );
    const buildableNames = new Set(
      [...catalogEntries.values()]
        .filter((entry) => ownedBuilderTypes.has(entry.sourceObjectName))
        .flatMap((entry) => entry.constructs)
    );
    const largestBuildableFootprintRadius = [...catalogEntries.values()]
      .filter((entry) => buildableNames.has(entry.sourceObjectName) && entry.constructionProfile)
      .reduce((largest, entry) => Math.max(largest, entry.constructionProfile?.footprintRadiusTiles ?? 0), 0);
    diagnostics.stage = "map";
    const map = projectAiObservationMap(
      this.scene,
      this.requestedGeneration,
      this.queryContinuationCursor,
      actors,
      liveById,
      tick,
      accessGraph,
      permittedTopology,
      this.accessGraphAdapter.getScoutSearchPoints(),
      (tile) => this.accessGraphAdapter.resolveNodeId(tile, ["ground"]),
      largestBuildableFootprintRadius
    );
    diagnostics.stage = "resources_and_obligations";
    const finishResourceRead = beginAiResourceInputRead(this.scene, this.player);
    const obligations = projectAiProductionObligations(
      liveActors
        .filter((actor) => getActorComponent(actor, OwnerComponent)?.getOwner() === playerNumber)
        .flatMap((actor) => getActorComponent(actor, QueueComponent)?.allItems ?? [])
    );
    const resources = Object.values(ResourceType)
      .sort()
      .map((resourceType) => {
        const deliveredIncome = this.getDeliveredIncomePerMinute?.(resourceType);
        return {
          resourceType,
          stockpile: this.player.getResources()[resourceType] ?? 0,
          // Shared components have no cash escrow. Pending AI dispatch claims remain a separate admission owner.
          reservedUnspent: 0,
          obligationsDue: obligations[resourceType],
          deliveredIncomePerMinute:
            deliveredIncome !== undefined && Number.isFinite(deliveredIncome)
              ? knownValue(Math.max(0, deliveredIncome), tick)
              : unknownValue("not_supported")
        };
      });

    diagnostics.stage = "finalize_observation";
    const captured = {
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
        modeGoals: projectModeGoals(this.scene, this.player, actors),
        researchCandidates: projectResearchCandidates(projectedActors, liveById),
        threatSummary: projectThreatSummary(actors, tick),
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
    } satisfies { observation: AiObservationV1; catalog: AiCapabilityCatalogV1 };
    finishResourceRead?.(captured.observation);
    return captured;
  }

  private isEligibleActor(actor: Phaser.GameObjects.GameObject): boolean {
    if (!actor.active || actor.scene !== this.scene) return false;
    const health = getActorComponent(actor, HealthComponent);
    return !health?.killed;
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
      ...(actor.mainBuilding?.status === "known" ? { mainBuilding: actor.mainBuilding.value } : {}),
      position: actor.logicalPosition.status === "known" ? { ...actor.logicalPosition.value } : null
    });
    trimRememberedContacts(this.memory);
    this.knowledgeRevision += 1;
  }

  private projectAccessProducts(
    actors: readonly AiObservedActorV1[],
    liveById: ReadonlyMap<ActorId, Phaser.GameObjects.GameObject>,
    tick: number
  ): AiObservedAccessProductV1[] {
    const owned = actors.filter((actor) => actor.visibility === "owned" && actor.accessNodeId.status === "known");
    const contacts = actors.filter(
      (actor) => actor.visibility === "visible" && actor.relation === "enemy" && actor.accessNodeId.status === "known"
    );
    const candidates = owned
      .flatMap((source) => contacts.map((target) => ({ source, target })))
      .sort(compareAccessProductCandidates);
    if (candidates.length === 0) return [];
    const scheduled = selectBoundedObservationWork(
      candidates,
      this.queryContinuationCursor,
      MAX_ACCESS_PRODUCTS_PER_OBSERVATION
    );
    const selected = scheduled.selected;
    this.queryContinuationCursor = scheduled.nextCursor;
    if (selected.length > 0) this.invalidationDebt = Math.max(0, this.invalidationDebt - selected.length);
    return selected.map(({ source, target }) =>
      projectAccessProduct(this.scene, this.queryInputRevision, source, target, liveById, tick)
    );
  }

  private destroy(): void {
    if (this.navigationInvalidationListener) {
      this.scene.events.off(NavigationService.UpdateNavigationEvent, this.navigationInvalidationListener);
      this.navigationInvalidationListener = undefined;
    }
  }
}

function safeAiCaptureErrorCode(error: unknown): string {
  if (error instanceof TypeError) {
    const property = error.message.match(
      /^Cannot read properties of (?:undefined|null) \(reading '([A-Za-z0-9_]{1,40})'\)$/
    )?.[1];
    return property ? `missing_${property}` : "type_error";
  }
  if (error instanceof Error && error.message === "Scene is not of type ProbableWaffleSceneData") {
    const callers = (error.stack ?? "")
      .split("\n")
      .slice(1)
      .map((line) => line.match(/\bat ([A-Za-z0-9_.$<>-]+) \(/)?.[1])
      .filter((name): name is string => name !== undefined)
      .slice(0, 3);
    return `invalid_scene_context${callers.length ? `_${callers.join("_")}` : ""}`;
  }
  return error instanceof Error ? "capture_error" : "unknown_error";
}

function compareByActorId(left: Phaser.GameObjects.GameObject, right: Phaser.GameObjects.GameObject): number {
  return (getActorComponent(left, IdComponent)?.id ?? "").localeCompare(
    getActorComponent(right, IdComponent)?.id ?? ""
  );
}

export {
  isCurrentObservationGeneration,
  selectBoundedObservationWork,
  accumulateObservationInvalidationDebt
} from "./ai-observation-work";
export {
  decayObservationConfidence,
  isRememberedContactExpired,
  normalizeAiObservationMemoryState
} from "./ai-observation-memory";
export { normalizeGatherResourceTypes } from "./ai-observation-capabilities";
export type { AiObservationDebugSnapshot } from "./ai-observation-debug-snapshot";
