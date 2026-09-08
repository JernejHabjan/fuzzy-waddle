import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  AiBrainStateV1,
  AiFortificationNodeStateV1,
  AiFortificationStateV1
} from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogEntryV1, AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

/** Initial graph caps prevent a new plan identity from turning fortification into unbounded work. */
export const AI_STAGE_11_GRAPH_CAPS = { walls: 16, towers: 3, stairs: 2 } as const;
export const AI_STAGE_11_STANDARD_SPEND_PERMILLE = 200;
export const AI_STAGE_11_TURTLE_SPEND_PERMILLE = 300;
const BREACH_RETRY_TICKS = 100;
const MAX_BREACH_RECOVERY_ATTEMPTS = 2;

type ConstructionCell = NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number];
type Axis = "x" | "y";

function tileKey(position: Pick<Vector3Simple, "x" | "y">): string {
  return `${position.x},${position.y}`;
}

function positionOf(actor: AiObservationV1["actors"][number]): Vector3Simple | null {
  return actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

function resourceEntries(cost: Readonly<Partial<Record<ResourceType, number>>>): [ResourceType, number][] {
  return Object.values(ResourceType)
    .flatMap((resourceType): [ResourceType, number][] => {
      const amount = cost[resourceType];
      return typeof amount === "number" && Number.isFinite(amount) && amount > 0 ? [[resourceType, amount]] : [];
    })
    .sort((left, right) => left[0].localeCompare(right[0]));
}

function hasUnmetMacroFloor(state: AiBrainStateV1): boolean {
  const protectedPurposes = new Set(["bootstrap_worker", "supply_buffer", "sustainable_food"]);
  return state.economyProduction.demands.some((demand) => {
    if (!protectedPurposes.has(demand.purpose)) return false;
    const committed =
      demand.satisfiedActorIds.length +
      demand.queuedIds.length +
      demand.constructingIds.length +
      demand.acceptedNotObservedEffectIds.length;
    return committed < demand.desired;
  });
}

/** Legacy `safe` saves retain the same defensive intent as the Stage-14 `turtle` profile. */
function isDefensiveArchetype(archetypeId: string): boolean {
  return archetypeId.endsWith(":safe") || archetypeId.endsWith(":turtle");
}

function reachable(
  cells: ReadonlyMap<string, ConstructionCell>,
  blocked: ReadonlySet<string>,
  startKey: string
): ReadonlySet<string> {
  if (!cells.get(startKey)?.groundPassable || blocked.has(startKey)) return new Set();
  const visited = new Set([startKey]);
  const queue = [startKey];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [xText = "0", yText = "0"] = queue[cursor]?.split(",") ?? [];
    const x = Number(xText);
    const y = Number(yText);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
      const next = `${x + dx},${y + dy}`;
      if (visited.has(next) || blocked.has(next) || !cells.get(next)?.groundPassable) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited;
}

function nearestPassableKey(
  cells: ReadonlyMap<string, ConstructionCell>,
  blocked: ReadonlySet<string>,
  position: Vector3Simple
): string | null {
  const candidates = [...cells.values()]
    .filter((cell) => cell.groundPassable && !blocked.has(cell.tileKey))
    .map((cell) => ({ cell, distance: Math.abs(cell.position.x - position.x) + Math.abs(cell.position.y - position.y) }))
    .filter((candidate) => candidate.distance <= 2)
    .sort((left, right) => left.distance - right.distance || left.cell.position.y - right.cell.position.y || left.cell.position.x - right.cell.position.x);
  return candidates[0]?.cell.tileKey ?? null;
}

/** Pure whole-layout check used by the manager and deterministic Stage 11 fixtures. */
export function fortificationPreservesConnectivityV1(input: {
  readonly cells: readonly ConstructionCell[];
  readonly blockedTileKeys: readonly string[];
  readonly protectedPosition: Vector3Simple;
  readonly openingPosition: Vector3Simple;
  readonly exteriorPosition: Vector3Simple;
  readonly requiredPositions: readonly Vector3Simple[];
}): boolean {
  const cells = new Map(input.cells.map((cell) => [cell.tileKey, cell]));
  const blocked = new Set(input.blockedTileKeys);
  const openingKey = nearestPassableKey(cells, blocked, input.openingPosition);
  const protectedKey = nearestPassableKey(cells, blocked, input.protectedPosition);
  const exteriorKey = nearestPassableKey(cells, blocked, input.exteriorPosition);
  if (!openingKey || !protectedKey || !exteriorKey) return false;
  const connected = reachable(cells, blocked, openingKey);
  if (!connected.has(protectedKey) || !connected.has(exteriorKey)) return false;
  return input.requiredPositions.every((position) => {
    const key = nearestPassableKey(cells, blocked, position);
    return key !== null && connected.has(key);
  });
}

function threatPosition(observation: AiObservationV1, anchor: Vector3Simple): Vector3Simple | null {
  return observation.actors
    .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
    .map((actor) => positionOf(actor))
    .filter((position): position is Vector3Simple => position !== null)
    .sort((left, right) =>
      Math.abs(left.x - anchor.x) + Math.abs(left.y - anchor.y) -
        (Math.abs(right.x - anchor.x) + Math.abs(right.y - anchor.y)) ||
      left.y - right.y || left.x - right.x
    )[0] ?? null;
}

function constructionEntry(catalog: AiCapabilityCatalogV1, objectName: ObjectNames): AiCapabilityCatalogEntryV1 | null {
  return catalog.entries
    .filter((entry) => entry.sourceObjectName === objectName)
    .sort((left, right) => right.effectiveLevel - left.effectiveLevel || left.capabilityId.localeCompare(right.capabilityId))[0] ?? null;
}

function node(
  planId: AiFortificationStateV1["planId"],
  kind: AiFortificationNodeStateV1["kind"],
  objectName: ObjectNames | null,
  position: Vector3Simple,
  componentId: string,
  dependsOnNodeId: string | null,
  navigation: AiCapabilityCatalogEntryV1["constructionProfile"] | null,
  marginalCoverage: number,
  targetDomains: AiFortificationNodeStateV1["targetDomains"]
): AiFortificationNodeStateV1 {
  const nodeId = `${planId}:node:${kind}:${position.x}:${position.y}:${position.z}`;
  const footprintRadius = navigation?.footprintRadiusTiles ?? 0;
  const footprintTileKeys: string[] = [];
  for (let y = position.y - footprintRadius; y <= position.y + footprintRadius; y += 1) {
    for (let x = position.x - footprintRadius; x <= position.x + footprintRadius; x += 1) {
      footprintTileKeys.push(tileKey({ x, y }));
    }
  }
  return {
    nodeId,
    kind,
    objectName,
    position,
    footprintTileKeys,
    navigation: navigation
      ? {
          navigableHeight: navigation.navigableHeight,
          enterHeight: navigation.enterHeight,
          exitHeight: navigation.exitHeight
        }
      : null,
    componentId,
    dependsOnNodeId,
    lifecycle: kind === "gate_slot" && objectName === null ? "finished" : "planned",
    completedActorId: null,
    attempt: 0,
    effectId: null,
    retryAfterTick: 0,
    marginalCoverage,
    targetDomains,
    defenderPostReachable: kind === "gate_slot" || kind === "stair"
  };
}

function sumCost(
  nodes: readonly AiFortificationNodeStateV1[],
  entries: ReadonlyMap<string, AiCapabilityCatalogEntryV1>
): Partial<Record<ResourceType, number>> {
  const result: Partial<Record<ResourceType, number>> = {};
  for (const current of nodes) {
    if (!current.objectName) continue;
    const cost = entries.get(current.objectName)?.constructionProfile?.resourceCost ?? {};
    for (const [resourceType, amount] of resourceEntries(cost)) result[resourceType] = (result[resourceType] ?? 0) + amount;
  }
  return result;
}

function reconcileNode(
  current: AiFortificationNodeStateV1,
  observation: AiObservationV1,
  outcomes: readonly AiCommandOutcomeV1[],
  reserved: boolean
): AiFortificationNodeStateV1 {
  if (!current.objectName) return current;
  const observed = observation.actors.find((actor) => {
    const position = positionOf(actor);
    return actor.relation === "self" && actor.objectName === current.objectName && position !== null && tileKey(position) === tileKey(current.position);
  });
  if (observed) {
    const finished = observed.constructionProgress?.status !== "known" || observed.constructionProgress.value >= 100;
    return {
      ...current,
      lifecycle: finished ? "finished" : "requested",
      completedActorId: observed.actorId,
      attempt: finished ? 0 : current.attempt,
      retryAfterTick: observation.tick + 40
    };
  }
  if (current.lifecycle === "finished" && observation.tick >= current.retryAfterTick) {
    return { ...current, lifecycle: "destroyed", completedActorId: null, effectId: null, retryAfterTick: observation.tick + BREACH_RETRY_TICKS };
  }
  const outcome = current.effectId
    ? [...outcomes].reverse().find((candidate) => candidate.identity.effectId === current.effectId)
    : undefined;
  if (!outcome) {
    if (reserved) return { ...current, lifecycle: "requested" };
    if (current.lifecycle === "requested" && observation.tick >= current.retryAfterTick) {
      return { ...current, lifecycle: "planned" };
    }
    return current;
  }
  if (outcome.kind === "completed") {
    return {
      ...current,
      lifecycle: "finished",
      completedActorId: outcome.resultingActorIds[0] ?? null,
      attempt: 0,
      retryAfterTick: observation.tick + 40
    };
  }
  if (outcome.kind === "rejected" || outcome.kind === "failed" || outcome.kind === "cancelled") {
    return {
      ...current,
      lifecycle: current.lifecycle === "destroyed" ? "destroyed" : "planned",
      completedActorId: null,
      attempt: current.attempt + 1,
      effectId: null,
      retryAfterTick: observation.tick + BREACH_RETRY_TICKS
    };
  }
  return { ...current, lifecycle: "requested" };
}

/**
 * Owns one bounded, persistent fortification graph per base. All candidates come from the
 * committed local topology, while shared construction remains final placement authority.
 */
export class AiStage11FortificationManagerV1 implements AiProposalManagerV1 {
  readonly managerId = "stage-11-fortifications";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined,
    private readonly gateObjectName: ObjectNames | null = null
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) return this.empty("catalog_not_ready", false);
    const cells = observation.map?.constructionCells ?? [];
    if (!cells.length) return this.empty("construction_topology_not_ready", false);

    const reconciled = state.fortifications.map((plan) => this.reconcilePlan(plan, observation, state));
    const activeBases = state.bases
      .filter((base) => base.active && base.anchorPosition && base.lifecycle !== "lost")
      .sort((left, right) => left.baseId.localeCompare(right.baseId));
    const planNeedingWork = reconciled.find((candidate) => candidate.lifecycle !== "active" && candidate.lifecycle !== "abandoned" && candidate.graph);
    const planBaseId = planNeedingWork?.graph?.baseId;
    const activeBase = planNeedingWork
      ? activeBases.find((base) => base.baseId === planBaseId)
      : activeBases.find((base) => !reconciled.some((candidate) => candidate.graph?.baseId === base.baseId));
    if (!activeBase?.anchorPosition) return this.result(reconciled, [], [activeBases.length ? "fortifications_stable" : "active_base_not_ready"]);

    let plan = planNeedingWork;
    if (!plan) {
      if (hasUnmetMacroFloor(state)) return this.result(reconciled, [], ["macro_survival_or_supply_floor_unmet"]);
      plan = this.createPlan(observation, { ...state, fortifications: reconciled }, activeBase.baseId, activeBase.anchorPosition, catalog);
      if (!plan) return this.result(reconciled, [], ["no_justified_connected_choke"]);
      reconciled.push(plan);
    }

    const defendedIncident = state.skirmish.incidents.some((candidate) => candidate.baseId === null || candidate.baseId === activeBase.baseId);
    if (plan.lifecycle === "breached" && plan.graph && !defendedIncident && !isDefensiveArchetype(state.opening.archetypeId)) {
      const abandoned = {
        ...plan,
        lifecycle: "abandoned" as const,
        graph: {
          ...plan.graph,
          nodes: plan.graph.nodes.map((current) => current.lifecycle === "destroyed" ? { ...current, lifecycle: "abandoned" as const } : current),
          breach: { ...plan.graph.breach, reason: "protected_value_no_longer_justifies_rebuild" }
        }
      };
      return this.result(reconciled.map((candidate) => candidate.planId === abandoned.planId ? abandoned : candidate), [], ["breach_abandoned_low_value"]);
    }

    const intents = [
      ...this.createIntents(plan, observation, catalog),
      ...this.createBreachResponse(plan, observation, state)
    ];
    const selectedPlan = plan;
    const plans = reconciled.map((candidate) => candidate.planId === selectedPlan.planId ? this.markProposedEffects(candidate, intents, observation.tick) : candidate);
    return this.result(plans, intents, [
      `plan:${plan.planId}:${plan.lifecycle}`,
      `nodes:${plan.completedNodeIds.length}/${plan.nodeIds.length}`,
      `opening:${plan.graph?.openingNodeId ?? "legacy"}`
    ]);
  }

  private empty(reason: string, evaluated: boolean): AiManagerProposalV1 {
    return { managerId: this.managerId, lane: "optional_infrastructure_tech", evaluated, intents: [], reasons: [reason] };
  }

  private result(
    fortifications: readonly AiFortificationStateV1[],
    intents: readonly AiIntentV1[],
    reasons: readonly string[]
  ): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "optional_infrastructure_tech",
      evaluated: true,
      intents,
      reasons,
      statePatch: { fortifications }
    };
  }

  private createPlan(
    observation: AiObservationV1,
    state: AiBrainStateV1,
    baseId: AiFortificationStateV1["protectedBaseIds"][number],
    anchor: Vector3Simple,
    catalog: AiCapabilityCatalogV1
  ): AiFortificationStateV1 | null {
    const incident = state.skirmish.incidents
      .filter((candidate) => candidate.baseId === null || candidate.baseId === baseId)
      .sort((left, right) => right.severity - left.severity || left.incidentId.localeCompare(right.incidentId))[0];
    const defensiveProfile = isDefensiveArchetype(state.opening.archetypeId);
    if ((!incident || incident.severity < 100) && !defensiveProfile) return null;
    const enemy = threatPosition(observation, anchor);
    const target = enemy ?? (observation.map?.bounds.status === "known"
      ? { x: observation.map.bounds.value.width / 2, y: observation.map.bounds.value.height / 2, z: 0 }
      : null);
    if (!target) return null;

    const wallEntry = constructionEntry(catalog, ObjectNames.Wall);
    const towerEntry = constructionEntry(catalog, ObjectNames.WatchTower);
    const stairEntry = constructionEntry(catalog, ObjectNames.Stairs);
    const builders = observation.actors
      .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
      .filter((actor) => catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName &&
        [ObjectNames.Wall, ObjectNames.WatchTower, ObjectNames.Stairs].every((objectName) => entry.constructs.includes(objectName))));
    if (!wallEntry?.constructionProfile || !towerEntry?.constructionProfile || !stairEntry?.constructionProfile || builders.length < 2) return null;
    if (
      stairEntry.constructionProfile.enterHeight !== 0 ||
      stairEntry.constructionProfile.exitHeight === null ||
      stairEntry.constructionProfile.exitHeight !== wallEntry.constructionProfile.enterHeight ||
      stairEntry.constructionProfile.exitHeight !== towerEntry.constructionProfile.enterHeight
    ) return null;

    const byKey = new Map((observation.map?.constructionCells ?? []).map((cell) => [cell.tileKey, cell]));
    const dx = target.x - anchor.x;
    const dy = target.y - anchor.y;
    const frontAxis: Axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    const crossAxis: Axis = frontAxis === "x" ? "y" : "x";
    const direction = (frontAxis === "x" ? dx : dy) >= 0 ? 1 : -1;
    const center = { ...anchor, [frontAxis]: Math.round(anchor[frontAxis]) + 4 * direction, [crossAxis]: Math.round(anchor[crossAxis]) };
    const atOffset = (offset: number, frontOffset = 0): Vector3Simple => ({
      ...center,
      [frontAxis]: center[frontAxis] + frontOffset * direction,
      [crossAxis]: center[crossAxis] + offset
    });
    const isAnchor = (offset: number) => {
      const position = atOffset(offset);
      const cell = byKey.get(tileKey(position));
      if (cell) return !cell.groundPassable || cell.waterPassable || cell.observedBlocked;
      const bounds = observation.map?.bounds;
      return bounds?.status === "known" &&
        (position.x < 0 || position.y < 0 || position.x >= bounds.value.width || position.y >= bounds.value.height);
    };
    let negativeAnchor: number | null = null;
    let positiveAnchor: number | null = null;
    for (let offset = 1; offset <= 8; offset += 1) {
      if (negativeAnchor === null && isAnchor(-offset)) negativeAnchor = -offset;
      if (positiveAnchor === null && isAnchor(offset)) positiveAnchor = offset;
    }
    if (negativeAnchor === null || positiveAnchor === null) return null;
    const offsets = Array.from({ length: positiveAnchor - negativeAnchor - 1 }, (_, index) => negativeAnchor + index + 1)
      .filter((offset) => offset !== 0);
    if (offsets.length < 4 || offsets.length > AI_STAGE_11_GRAPH_CAPS.walls + AI_STAGE_11_GRAPH_CAPS.towers) return null;
    if (offsets.some((offset) => !byKey.get(tileKey(atOffset(offset)))?.groundPassable)) return null;

    const planId = `fortification:${baseId}` as AiFortificationStateV1["planId"];
    const gateEntry = this.gateObjectName ? constructionEntry(catalog, this.gateObjectName) : null;
    if (this.gateObjectName && !gateEntry?.constructionProfile) return null;
    const gate = node(planId, "gate_slot", this.gateObjectName, atOffset(0), "opening", null, gateEntry?.constructionProfile ?? null, 0, gateEntry?.targetDomains ?? []);
    const negativeOffsets = offsets.filter((offset) => offset < 0).reverse();
    const positiveOffsets = offsets.filter((offset) => offset > 0);
    const firstOffset = offsets[0];
    const lastOffset = offsets.at(-1);
    if (!negativeOffsets.length || !positiveOffsets.length || firstOffset === undefined || lastOffset === undefined) return null;
    const towerOffsets = [firstOffset, lastOffset];
    const covered = new Set<string>();
    const nodes: AiFortificationNodeStateV1[] = [gate];
    for (const side of [negativeOffsets, positiveOffsets] as const) {
      let dependency: string | null = null;
      const rootOffset = side[0];
      if (rootOffset === undefined) continue;
      const componentId = rootOffset < 0 ? "left" : "right";
      for (const offset of side) {
        const isTower = towerOffsets.includes(offset);
        const position = atOffset(offset);
        const range = towerEntry.constructionProfile?.visionRange ?? 0;
        const laneTiles = Array.from({ length: Math.max(0, Math.floor(range)) }, (_, index) => tileKey(atOffset(offset, index + 1)));
        const marginalCoverage = isTower ? laneTiles.filter((key) => !covered.has(key)).length : 0;
        if (isTower) laneTiles.forEach((key) => covered.add(key));
        const current = node(
          planId,
          isTower ? "tower" : "wall",
          isTower ? ObjectNames.WatchTower : ObjectNames.Wall,
          position,
          componentId,
          dependency,
          (isTower ? towerEntry : wallEntry).constructionProfile ?? null,
          marginalCoverage,
          isTower ? towerEntry.targetDomains : []
        );
        nodes.push(current);
        dependency = current.nodeId;
      }
      const stairPosition = atOffset(rootOffset, -1);
      if (byKey.get(tileKey(stairPosition))?.groundPassable) {
        const rootPosition = atOffset(rootOffset);
        const rootNodeId = nodes.find((candidate) => candidate.position.x === rootPosition.x && candidate.position.y === rootPosition.y)?.nodeId ?? null;
        nodes.push(node(planId, "stair", ObjectNames.Stairs, stairPosition, componentId, rootNodeId, stairEntry.constructionProfile ?? null, 0, []));
      }
    }
    const stairComponents = new Set(nodes.filter((candidate) => candidate.kind === "stair").map((candidate) => candidate.componentId));
    const routedNodes = nodes.map((candidate) =>
      candidate.kind === "wall" || candidate.kind === "tower"
        ? { ...candidate, defenderPostReachable: stairComponents.has(candidate.componentId) }
        : candidate
    );
    if (routedNodes.length > this.profile.maxPlacementCandidatesPerStep ||
        routedNodes.filter((candidate) => candidate.kind === "wall").length > AI_STAGE_11_GRAPH_CAPS.walls ||
        routedNodes.filter((candidate) => candidate.kind === "tower").length > AI_STAGE_11_GRAPH_CAPS.towers ||
        routedNodes.filter((candidate) => candidate.kind === "stair").length > AI_STAGE_11_GRAPH_CAPS.stairs ||
        routedNodes.some((candidate) => candidate.kind !== "gate_slot" && !candidate.defenderPostReachable)) return null;
    const occupiedFootprints = new Set<string>();
    for (const candidate of routedNodes) {
      if (candidate.footprintTileKeys.some((key) => !byKey.get(key)?.groundPassable)) return null;
      if (candidate.footprintTileKeys.some((key) => occupiedFootprints.has(key))) return null;
      candidate.footprintTileKeys.forEach((key) => occupiedFootprints.add(key));
    }

    const shorePositions = (observation.map?.accessGraph?.transferPoints ?? [])
      .filter((point) => point.kind === "shore")
      .flatMap((point) => [point.passengerPosition, point.carrierPosition]);
    if (routedNodes.some((candidate) => candidate.kind !== "gate_slot" && candidate.footprintTileKeys.some((key) => {
      const [xText = "0", yText = "0"] = key.split(",");
      const x = Number(xText);
      const y = Number(yText);
      return shorePositions.some((shore) => Math.abs(shore.x - x) + Math.abs(shore.y - y) <= 2);
    }))) return null;
    const blocked = routedNodes.filter((candidate) => candidate.kind !== "gate_slot").flatMap((candidate) => candidate.footprintTileKeys);
    const requiredPositions = observation.actors
      .filter((actor) => actor.relation === "self" || (actor.relation !== "enemy" && actor.resourceState.status === "known"))
      .map(positionOf)
      .filter((position): position is Vector3Simple => position !== null)
      .filter((position) => Math.abs(position.x - anchor.x) + Math.abs(position.y - anchor.y) <= 12);
    const protectedPosition = atOffset(0, -1);
    const exteriorPosition = atOffset(0, 1);
    if (!fortificationPreservesConnectivityV1({ cells: observation.map?.constructionCells ?? [], blockedTileKeys: blocked, protectedPosition, openingPosition: gate.position, exteriorPosition, requiredPositions })) return null;

    const entries = new Map([[ObjectNames.Wall, wallEntry], [ObjectNames.WatchTower, towerEntry], [ObjectNames.Stairs, stairEntry]]);
    const committedByResource = sumCost(routedNodes, entries);
    const priorCommittedByResource: Partial<Record<ResourceType, number>> = {};
    for (const existing of state.fortifications.filter((candidate) => candidate.graph?.baseId !== baseId && candidate.lifecycle !== "abandoned")) {
      for (const [resourceType, amount] of resourceEntries(existing.graph?.budget.committedByResource ?? {})) {
        priorCommittedByResource[resourceType] = (priorCommittedByResource[resourceType] ?? 0) + amount;
      }
    }
    const spendPermille = defensiveProfile ? AI_STAGE_11_TURTLE_SPEND_PERMILLE : AI_STAGE_11_STANDARD_SPEND_PERMILLE;
    const remainingByResource: Partial<Record<ResourceType, number>> = {};
    for (const [resourceType, amount] of resourceEntries(committedByResource)) {
      const ledger = observation.resources.find((entry) => entry.resourceType === resourceType);
      const available = Math.max(0, (ledger?.stockpile ?? 0) - (ledger?.reservedUnspent ?? 0) - (ledger?.obligationsDue ?? 0));
      const ceiling = Math.floor(available * spendPermille / 1000);
      const prior = priorCommittedByResource[resourceType] ?? 0;
      if (prior + amount > ceiling) return null;
      remainingByResource[resourceType] = ceiling - prior - amount;
    }
    const protectedAssetIds = observation.actors
      .filter((actor) => actor.relation === "self")
      .map((actor) => ({ actorId: actor.actorId, position: positionOf(actor) }))
      .filter((actor): actor is { actorId: ActorId; position: Vector3Simple } => actor.position !== null)
      .filter((actor) => Math.abs(actor.position.x - anchor.x) + Math.abs(actor.position.y - anchor.y) <= 12)
      .map((actor) => actor.actorId)
      .sort();
    const eligibleDefenderIds = [...new Set(
      state.squads
        .filter((squad) => squad.role === "defense" || squad.role === "reserve")
        .filter((squad) => squad.domain === "ground" || squad.domain === "mixed")
        .flatMap((squad) => squad.actorIds)
        .filter((actorId) => observation.actors.some((actor) => actor.actorId === actorId && actor.relation === "self"))
    )].sort();
    return {
      planId,
      nodeIds: routedNodes.map((candidate) => candidate.nodeId),
      completedNodeIds: gate.objectName === null ? [gate.nodeId] : [],
      protectedBaseIds: [baseId],
      lifecycle: "planned",
      graph: {
        baseId,
        createdTick: observation.tick,
        terrainAnchorTileKeys: [tileKey(atOffset(negativeAnchor)), tileKey(atOffset(positiveAnchor))],
        openingNodeId: gate.nodeId,
        protectedAssetIds,
        wholeConnectivity: "preserved",
        incrementalConnectivity: "preserved",
        budget: { spendPermille, committedByResource, remainingByResource },
        nodes: routedNodes,
        constructionSequenceNodeIds: [
          ...routedNodes.filter((candidate) => candidate.kind !== "gate_slot").map((candidate) => candidate.nodeId),
          ...routedNodes.filter((candidate) => candidate.kind === "gate_slot" && candidate.objectName !== null).map((candidate) => candidate.nodeId)
        ],
        defenderPosts: routedNodes
          .filter((candidate) => candidate.kind === "tower")
          .map((candidate, index) => {
            const defenderId = eligibleDefenderIds[index];
            return { nodeId: candidate.nodeId, assignedActorIds: defenderId ? [defenderId] : [], reachable: false };
          }),
        breach: { missingNodeIds: [], reason: null, risk: "none", responseEffectId: null, recoveryAttempts: 0 }
      }
    };
  }

  private reconcilePlan(
    plan: AiFortificationStateV1,
    observation: AiObservationV1,
    state: AiBrainStateV1
  ): AiFortificationStateV1 {
    if (!plan.graph) return plan;
    const nodes = plan.graph.nodes.map((current) => {
      const effectClaimId = `claim:fortification:${current.nodeId}:effect`;
      const reserved = state.reservations.some((reservation) =>
        reservation.claimId === effectClaimId &&
        (reservation.state.kind !== "provisional" || reservation.state.expiresAt.dueTick > observation.tick)
      );
      return reconcileNode(current, observation, state.pendingOutcomes, reserved);
    });
    const missing = nodes.filter((current) => current.lifecycle === "destroyed").map((current) => current.nodeId).sort();
    const missingKinds = nodes.filter((current) => current.lifecycle === "destroyed").map((current) => current.kind);
    const liveStairComponents = new Set(
      nodes.filter((current) => current.kind === "stair" && current.lifecycle === "finished").map((current) => current.componentId)
    );
    const risk = missingKinds.some((kind) => kind === "stair" || kind === "tower")
      ? "high"
      : missingKinds.length > 0
        ? "medium"
        : "none";
    const recoveryAttempts = missing.length
      ? Math.max(
          plan.graph.breach.recoveryAttempts,
          ...nodes.filter((current) => current.lifecycle === "destroyed").map((current) => current.attempt + 1)
        )
      : plan.graph.breach.recoveryAttempts;
    const abandoned = recoveryAttempts > MAX_BREACH_RECOVERY_ATTEMPTS;
    const completedNodeIds = nodes.filter((current) => current.lifecycle === "finished").map((current) => current.nodeId).sort();
    const lifecycle = abandoned
      ? "abandoned"
      : missing.length
        ? "breached"
        : nodes.every((current) => current.lifecycle === "finished")
          ? "active"
          : nodes.some((current) => current.lifecycle === "requested" || current.lifecycle === "finished")
            ? "building"
            : "planned";
    return {
      ...plan,
      completedNodeIds,
      lifecycle,
      graph: {
        ...plan.graph,
        nodes: abandoned ? nodes.map((current) => current.lifecycle === "destroyed" ? { ...current, lifecycle: "abandoned" as const } : current) : nodes,
        defenderPosts: plan.graph.defenderPosts.map((post) => {
          const postNode = nodes.find((current) => current.nodeId === post.nodeId);
          return { ...post, reachable: postNode?.lifecycle === "finished" && liveStairComponents.has(postNode.componentId) };
        }),
        breach: {
          ...plan.graph.breach,
          missingNodeIds: missing,
          reason: missing.length ? "observed_finished_node_missing" : null,
          risk,
          responseEffectId: missing.length ? plan.graph.breach.responseEffectId : null,
          recoveryAttempts
        }
      }
    };
  }

  private createIntents(
    plan: AiFortificationStateV1,
    observation: AiObservationV1,
    catalog: AiCapabilityCatalogV1
  ): AiIntentV1[] {
    if (!plan.graph || plan.lifecycle === "abandoned") return [];
    const graph = plan.graph;
    const finished = new Set(graph.nodes.filter((current) => current.lifecycle === "finished").map((current) => current.nodeId));
    const candidates = graph.nodes
      .filter((current) => current.objectName !== null)
      .filter((current) => (current.lifecycle === "planned" || current.lifecycle === "destroyed") && current.retryAfterTick <= observation.tick)
      .filter((current) => current.dependsOnNodeId === null || finished.has(current.dependsOnNodeId))
      .sort((left, right) =>
        graph.constructionSequenceNodeIds.indexOf(left.nodeId) - graph.constructionSequenceNodeIds.indexOf(right.nodeId) ||
        left.nodeId.localeCompare(right.nodeId)
      )
      .slice(0, Math.min(2, this.profile.maxAcceptedCommandBatchesPerStep));
    return candidates.flatMap((current, index): AiIntentV1[] => {
      const objectName = current.objectName;
      if (objectName === null) return [];
      const entry = constructionEntry(catalog, objectName);
      const builder = observation.actors
        .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
        .find((actor) => catalog.entries.some((candidate) =>
          candidate.sourceObjectName === actor.objectName && candidate.constructs.includes(objectName)
        ));
      if (!builder) return [];
      const effectId = `effect:fortification:${plan.planId}:${current.nodeId}:${current.attempt}` as AiIntentV1["effectId"];
      const intentId = `intent:fortification:${plan.planId}:${current.nodeId}:${current.attempt}` as AiIntentV1["intentId"];
      const resourceClaims = resourceEntries(entry?.constructionProfile?.resourceCost ?? {}).map(([resourceType, amount], claimIndex) => ({
        claimId: `claim:fortification:${current.nodeId}:resource:${claimIndex}` as AiIntentV1["claims"][number]["claimId"],
        kind: "resource" as const,
        resourceType,
        amount
      }));
      return {
        kind: "construct" as const,
        intentId,
        effectId,
        planId: `plan:${plan.planId}` as AiIntentV1["planId"],
        demandId: null,
        lane: "optional_infrastructure_tech" as const,
        proposedTick: observation.tick,
        urgencyClass: current.lifecycle === "destroyed" ? 1 : 4,
        utility: Math.min(900, 500 + current.marginalCoverage * 10 + (current.lifecycle === "destroyed" ? 200 : 0)),
        preconditions: [
          { kind: "actor_exists" as const, actorId: builder.actorId },
          ...resourceClaims.map((claim) => ({ kind: "resource_at_least" as const, resourceType: claim.resourceType, amount: claim.amount }))
        ],
        claims: [
          { claimId: `claim:fortification:${current.nodeId}:builder` as AiIntentV1["claims"][number]["claimId"], kind: "actor" as const, actorId: builder.actorId },
          { claimId: `claim:fortification:${current.nodeId}:site` as AiIntentV1["claims"][number]["claimId"], kind: "site" as const, siteKey: `fortification:${current.nodeId}` },
          { claimId: `claim:fortification:${current.nodeId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect" as const, effectId },
          ...resourceClaims
        ],
        reasonCode: current.lifecycle === "destroyed" ? `fortification:breach_rebuild:${current.nodeId}` : `fortification:connected_prefix:${current.componentId}:${index}`,
        builderIds: [builder.actorId],
        objectName,
        logicalPosition: current.position,
        siteKey: `fortification:${current.nodeId}`
      };
    });
  }

  private createBreachResponse(
    plan: AiFortificationStateV1,
    observation: AiObservationV1,
    state: AiBrainStateV1
  ): AiIntentV1[] {
    if (plan.lifecycle !== "breached" || !plan.graph || plan.graph.breach.responseEffectId) return [];
    const missingComponents = new Set(
      plan.graph.nodes
        .filter((node) => plan.graph?.breach.missingNodeIds.includes(node.nodeId))
        .map((node) => node.componentId)
    );
    const assignedDisconnectedDefenders = plan.graph.defenderPosts
      .filter((post) => {
        const node = plan.graph?.nodes.find((candidate) => candidate.nodeId === post.nodeId);
        return node !== undefined && missingComponents.has(node.componentId);
      })
      .flatMap((post) => post.assignedActorIds);
    const squad = state.squads
      .filter((candidate) => candidate.domain === "ground" || candidate.domain === "mixed")
      .filter((candidate) => candidate.state !== "completed" && candidate.state !== "cancelled")
      .sort((left, right) => (left.role === "defense" ? -1 : 0) - (right.role === "defense" ? -1 : 0) || left.squadId.localeCompare(right.squadId))[0];
    const actorIds = [...new Set([...assignedDisconnectedDefenders, ...(squad?.actorIds ?? [])])]
      .filter((actorId) => observation.actors.some((actor) => actor.actorId === actorId && actor.relation === "self"))
      .slice(0, this.profile.maxActorOrdersPerStep);
    const graph = plan.graph;
    const opening = graph.nodes.find((candidate) => candidate.nodeId === graph.openingNodeId);
    const base = state.bases.find((candidate) => candidate.baseId === graph.baseId);
    if (!actorIds.length || !opening || !base?.anchorPosition) return [];
    const dx = Math.sign(base.anchorPosition.x - opening.position.x);
    const dy = Math.sign(base.anchorPosition.y - opening.position.y);
    const logicalPosition = { ...opening.position, x: opening.position.x + dx, y: opening.position.y + dy };
    const effectId = `effect:fortification:${plan.planId}:breach:${plan.graph.breach.recoveryAttempts}` as AiIntentV1["effectId"];
    return [{
      kind: "move",
      intentId: `intent:fortification:${plan.planId}:breach:${plan.graph.breach.recoveryAttempts}` as AiIntentV1["intentId"],
      effectId,
      planId: `plan:${plan.planId}` as AiIntentV1["planId"],
      demandId: null,
      lane: "army_threat",
      proposedTick: observation.tick,
      urgencyClass: 0,
      utility: 900,
      preconditions: actorIds.map((actorId) => ({ kind: "actor_exists" as const, actorId })),
      claims: [
        ...actorIds.map((actorId, index) => ({ claimId: `claim:fortification:${plan.planId}:defender:${index}` as AiIntentV1["claims"][number]["claimId"], kind: "actor" as const, actorId })),
        { claimId: `claim:fortification:${plan.planId}:breach-effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId }
      ],
      reasonCode: `fortification:breach_defenders:${plan.graph.breach.reason}`,
      actorIds,
      logicalPosition
    }];
  }

  private markProposedEffects(
    plan: AiFortificationStateV1,
    intents: readonly AiIntentV1[],
    tick: number
  ): AiFortificationStateV1 {
    if (!plan.graph) return plan;
    const effects = new Map(intents.filter((intent) => intent.kind === "construct").map((intent) => [intent.siteKey.replace(/^fortification:/, ""), intent.effectId]));
    const breachEffect = intents.find((intent) => intent.kind === "move" && intent.reasonCode.startsWith("fortification:breach_defenders:"))?.effectId ?? null;
    return {
      ...plan,
      graph: {
        ...plan.graph,
        nodes: plan.graph.nodes.map((current) => {
          const effectId = effects.get(current.nodeId);
          return effectId ? { ...current, effectId, retryAfterTick: tick + 80 } : current;
        }),
        breach: breachEffect ? { ...plan.graph.breach, responseEffectId: breachEffect } : plan.graph.breach
      }
    };
  }
}
