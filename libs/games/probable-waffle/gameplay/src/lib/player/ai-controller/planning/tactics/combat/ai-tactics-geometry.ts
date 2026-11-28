import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessNodeId } from "../../../contracts/ai-core-types";
import type { AiBrainState, AiSquadState } from "../../../contracts/state/ai-state-contracts";
import type { AiDomain, AiObservation, AiObservedActor } from "../../../contracts/observation/ai-observation";
import { MAX_RETREAT_CANDIDATES } from "./ai-tactics-rules";

export function knownPosition(actor: AiObservedActor | undefined): Vector3Simple | null {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

export function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

export function movementDomains(actor: AiObservedActor): readonly AiDomain[] {
  const domains = [...new Set(actor.capabilities.flatMap((capability) => capability.domains))].sort();
  return domains.length > 0 ? domains : ["ground"];
}

export function harmfulAt(position: Vector3Simple, observation: AiObservation): boolean {
  return observation.effects.some(
    (effect) => effect.influence === "harmful" && distance(position, effect.position) <= (effect.radius ?? 0) + 1
  );
}

export function hasKnownGroundRoute(
  sourceNodeId: AiAccessNodeId,
  targetNodeId: AiAccessNodeId,
  observation: AiObservation
): boolean | undefined {
  return createGroundRouteLookup(observation).hasRoute(sourceNodeId, targetNodeId);
}

/** Builds one indexed route query for the immutable observation used by a tactical decision. */
export function createGroundRouteLookup(observation: AiObservation) {
  const graph = observation.map?.accessGraph;
  const nodes = new Map(graph?.nodes.map((node) => [node.nodeId, node]) ?? []);
  const adjacency = new Map<AiAccessNodeId, AiAccessNodeId[]>();
  if (graph?.status === "ready") {
    for (const link of graph.links) {
      if (link.domain !== "ground" || link.knowledge === "unknown" || link.clearance < 1) continue;
      const from = adjacency.get(link.fromNodeId) ?? [];
      from.push(link.toNodeId);
      adjacency.set(link.fromNodeId, from);
      if (!link.directional) {
        const to = adjacency.get(link.toNodeId) ?? [];
        to.push(link.fromNodeId);
        adjacency.set(link.toNodeId, to);
      }
    }
  }
  const cellsByPosition = new Map(
    [...(observation.map?.constructionCells ?? []), ...(observation.map?.tacticalCells ?? [])].map((cell) => [
      `${cell.position.x},${cell.position.y},${cell.position.z}`,
      cell.groundAccessNodeId
    ])
  );
  const reachableBySource = new Map<AiAccessNodeId, Set<AiAccessNodeId>>();
  const hasRoute = (sourceNodeId: AiAccessNodeId, targetNodeId: AiAccessNodeId): boolean | undefined => {
    if (graph?.status !== "ready") return undefined;
    const source = nodes.get(sourceNodeId);
    const target = nodes.get(targetNodeId);
    if (!source || !target || source.domain !== "ground" || target.domain !== "ground") return false;
    if (source.knowledge === "unknown" || target.knowledge === "unknown") return false;
    if (source.clearance < 1 || target.clearance < 1) return false;
    let reachable = reachableBySource.get(sourceNodeId);
    if (!reachable) {
      reachable = new Set([sourceNodeId]);
      const queue = [sourceNodeId];
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const current = queue[cursor];
        if (!current) continue;
        for (const next of adjacency.get(current) ?? []) {
          if (reachable.has(next)) continue;
          const node = nodes.get(next);
          if (!node || node.domain !== "ground" || node.knowledge === "unknown" || node.clearance < 1) continue;
          reachable.add(next);
          queue.push(next);
        }
      }
      reachableBySource.set(sourceNodeId, reachable);
    }
    return reachable.has(targetNodeId);
  };
  const positionReachableFrom = (member: AiObservedActor, position: Vector3Simple): boolean | undefined => {
    if (!movementDomains(member).includes("ground")) return true;
    const sourceNodeId = member.accessNodeId?.status === "known" ? member.accessNodeId.value : null;
    if (!sourceNodeId) return undefined;
    if (!cellsByPosition.size) return undefined;
    const destinationNodeId = cellsByPosition.get(`${position.x},${position.y},${position.z}`);
    if (!destinationNodeId) return graph?.status === "ready" ? false : undefined;
    if (graph?.status === "ready") return hasRoute(sourceNodeId, destinationNodeId) === true;
    return graph ? sourceNodeId === destinationNodeId : undefined;
  };
  return { hasRoute, positionReachableFrom };
}

/** Uses a completed graph when available; while it is pending, only trust movement within a known region. */
export function groundPositionReachableFrom(
  member: AiObservedActor,
  position: Vector3Simple,
  observation: AiObservation
): boolean | undefined {
  return createGroundRouteLookup(observation).positionReachableFrom(member, position);
}

export function legalForMembers(
  position: Vector3Simple,
  observation: AiObservation,
  members: readonly AiObservedActor[]
): boolean {
  if (harmfulAt(position, observation)) return false;
  const cell = [...(observation.map?.constructionCells ?? []), ...(observation.map?.tacticalCells ?? [])].find(
    (candidate) => candidate.position.x === position.x && candidate.position.y === position.y
  );
  if (!cell) return members.every((member) => movementDomains(member).includes("air"));
  return members.every((member) =>
    movementDomains(member).some(
      (domain) =>
        domain === "air" || (domain === "water" ? cell.waterPassable : cell.groundPassable && !cell.observedBlocked)
    )
  );
}

export function safeRetreatPosition(
  observation: AiObservation,
  state: AiBrainState,
  members: readonly AiObservedActor[],
  protectedBaseId?: string | null
): Vector3Simple | null {
  const routeLookup = createGroundRouteLookup(observation);
  const anchors = state.bases
    .filter((base) => base.active && base.anchorPosition)
    .map((base) => base.anchorPosition!)
    .sort((left, right) => left.x - right.x || left.y - right.y);
  const cells = observation.map?.constructionCells ?? [];
  const candidates = anchors.slice(0, 4).flatMap((anchor) => [
    ...cells
      .map((cell) => cell.position)
      .sort((left, right) => distance(left, anchor) - distance(right, anchor))
      .slice(0, MAX_RETREAT_CANDIDATES),
    anchor
  ]);
  const allLegalCandidates = candidates.filter(
    (candidate) =>
      legalForMembers(candidate, observation, members) &&
      members.every((member) => routeLookup.positionReachableFrom(member, candidate) !== false)
  );
  const protectedBase = protectedBaseId
    ? (state.bases.find((base) => base.baseId === protectedBaseId && base.active) ??
      (protectedBaseId === "base:home"
        ? state.bases.find((base) => base.active && base.anchorActorId !== null)
        : undefined))
    : undefined;
  const protectedBasePosition = protectedBase?.anchorPosition;
  const formationFootprint = formationSpacing(members) * formationRings(members.length) * 2;
  // Keep the whole retreat formation inside the base's local defense radius, not just its anchor tile.
  const localDefenseRadius = Math.max(0, 12 - formationFootprint);
  const localDefenseCandidates = protectedBasePosition
    ? allLegalCandidates.filter((candidate) => distance(candidate, protectedBasePosition) <= localDefenseRadius)
    : [];
  const legalCandidates = localDefenseCandidates.length > 0 ? localDefenseCandidates : allLegalCandidates;
  const visibleThreats = observation.actors.flatMap((actor) => {
    const position = actor.relation === "enemy" && actor.visibility === "visible" ? knownPosition(actor) : null;
    return position ? [position] : [];
  });
  if (visibleThreats.length === 0) return legalCandidates[0] ?? null;
  const nearestThreat = (candidate: Vector3Simple) =>
    Math.min(...visibleThreats.map((threat) => distance(candidate, threat)));
  const nearestAnchor = (candidate: Vector3Simple) => Math.min(...anchors.map((anchor) => distance(candidate, anchor)));
  return (
    legalCandidates.sort(
      (left, right) =>
        nearestThreat(right) - nearestThreat(left) ||
        (protectedBasePosition
          ? distance(left, protectedBasePosition) - distance(right, protectedBasePosition)
          : nearestAnchor(left) - nearestAnchor(right)) ||
        left.x - right.x ||
        left.y - right.y
    )[0] ?? null
  );
}

export function formationPositions(
  members: readonly AiObservedActor[],
  anchor: Vector3Simple | null,
  observation: AiObservation,
  rejectedPositionByActor: ReadonlyMap<string, string> = new Map(),
  previousAssignments: NonNullable<AiSquadState["tactics"]>["assignedPositions"] = []
): NonNullable<AiSquadState["tactics"]>["assignedPositions"] {
  if (!anchor) return [];
  const spacing = formationSpacing(members);
  const rings = formationRings(Math.max(members.length, previousAssignments.length));
  const offsets = [
    { x: spacing, y: 0 },
    { x: -spacing, y: 0 },
    { x: 0, y: spacing },
    { x: 0, y: -spacing },
    { x: spacing, y: spacing },
    { x: -spacing, y: spacing },
    { x: spacing, y: -spacing },
    { x: -spacing, y: -spacing }
  ];
  // Retain the original inner-ring order; larger armies get complete additional rings, not eight shared slots.
  for (let ring = 2; ring <= rings; ring++)
    for (let y = -ring; y <= ring; y++)
      for (let x = -ring; x <= ring; x++)
        if (Math.max(Math.abs(x), Math.abs(y)) === ring) offsets.push({ x: x * spacing, y: y * spacing });
  const used = new Set<string>();
  const assignments: { actorId: string; position: Vector3Simple }[] = [];
  const previousByActor = new Map(previousAssignments.map((assignment) => [assignment.actorId, assignment.position]));
  // Arrival changes spatial sorting. A settled actor owns its legal slot before newcomers choose free positions.
  for (const actor of members) {
    const position = previousByActor.get(actor.actorId);
    if (!position) continue;
    const key = `${position.x},${position.y}`;
    if (
      used.has(key) ||
      rejectedPositionByActor.get(actor.actorId) === key ||
      distance(position, anchor) > spacing * rings * 2 ||
      !legalForMembers(position, observation, [actor])
    )
      continue;
    used.add(key);
    assignments.push({ actorId: actor.actorId, position });
  }
  const assignedActors = new Set(assignments.map((assignment) => assignment.actorId));
  members.forEach((actor, index) => {
    if (assignedActors.has(actor.actorId)) return;
    const rejectedPosition = rejectedPositionByActor.get(actor.actorId);
    const fallbackOffset = offsets[index];
    const candidateOffsets = previousAssignments.length
      ? [...offsets.slice(index), ...offsets.slice(0, index)]
      : rejectedPosition
        ? offsets.slice(index)
        : fallbackOffset
          ? [fallbackOffset]
          : [];
    const candidate = candidateOffsets
      .map((offset) => ({ x: anchor.x + offset.x, y: anchor.y + offset.y, z: anchor.z }))
      .find((position) => {
        const key = `${position.x},${position.y}`;
        return !used.has(key) && rejectedPosition !== key && legalForMembers(position, observation, [actor]);
      });
    if (!candidate) return;
    used.add(`${candidate.x},${candidate.y}`);
    assignments.push({ actorId: actor.actorId, position: candidate });
  });
  return assignments;
}

/** A square perimeter supplies 8r slots; complete rings supply (2r + 1)^2 - 1 distinct positions. */
function formationRings(count: number): number {
  return Math.max(1, Math.ceil((Math.sqrt(count + 1) - 1) / 2));
}

function formationSpacing(members: readonly AiObservedActor[]): number {
  return Math.max(
    1,
    ...members.map((actor) =>
      actor.combatProfile?.status === "known"
        ? Math.ceil(Math.max(0, ...actor.combatProfile.value.attacks.map((attack) => attack.minRange))) + 1
        : 1
    )
  );
}
