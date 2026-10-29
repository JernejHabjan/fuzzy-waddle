import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiDomainV1, AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { MAX_RETREAT_CANDIDATES } from "./ai-tactics-rules";

export function knownPosition(actor: AiObservedActorV1 | undefined): Vector3Simple | null {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

export function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

export function movementDomains(actor: AiObservedActorV1): readonly AiDomainV1[] {
  const domains = [...new Set(actor.capabilities.flatMap((capability) => capability.domains))].sort();
  return domains.length > 0 ? domains : ["ground"];
}

export function harmfulAt(position: Vector3Simple, observation: AiObservationV1): boolean {
  return observation.effects.some(
    (effect) => effect.influence === "harmful" && distance(position, effect.position) <= (effect.radius ?? 0) + 1
  );
}

export function legalForMembers(
  position: Vector3Simple,
  observation: AiObservationV1,
  members: readonly AiObservedActorV1[]
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
  observation: AiObservationV1,
  state: AiBrainStateV1,
  members: readonly AiObservedActorV1[],
  protectedBaseId?: string | null
): Vector3Simple | null {
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
  const allLegalCandidates = candidates.filter((candidate) => legalForMembers(candidate, observation, members));
  const protectedBase = protectedBaseId
    ? state.bases.find((base) => base.baseId === protectedBaseId && base.active) ??
      (protectedBaseId === "base:home"
        ? state.bases.find((base) => base.active && base.anchorActorId !== null)
        : undefined)
    : undefined;
  const protectedBasePosition = protectedBase?.anchorPosition;
  const localDefenseCandidates = protectedBasePosition
    ? allLegalCandidates.filter((candidate) => distance(candidate, protectedBasePosition) <= 12)
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
  members: readonly AiObservedActorV1[],
  anchor: Vector3Simple | null,
  observation: AiObservationV1
): NonNullable<AiSquadStateV1["tactics"]>["assignedPositions"] {
  if (!anchor) return [];
  const spacing = Math.max(
    1,
    ...members.map((actor) =>
      actor.combatProfile?.status === "known"
        ? Math.ceil(Math.max(0, ...actor.combatProfile.value.attacks.map((attack) => attack.minRange))) + 1
        : 1
    )
  );
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
  return members.slice(0, offsets.length).flatMap((actor, index) => {
    const offset = offsets[index]!;
    const candidate = { x: anchor.x + offset.x, y: anchor.y + offset.y, z: anchor.z };
    return legalForMembers(candidate, observation, [actor]) ? [{ actorId: actor.actorId, position: candidate }] : [];
  });
}
