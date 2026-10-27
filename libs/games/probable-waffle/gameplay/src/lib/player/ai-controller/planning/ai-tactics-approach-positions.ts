import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessNodeId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { knownPosition, legalForMembers, movementDomains } from "./ai-tactics-geometry";

function hasKnownGroundRoute(
  sourceNodeId: AiAccessNodeId,
  targetNodeId: AiAccessNodeId,
  observation: AiObservationV1
): boolean | undefined {
  const graph = observation.map?.accessGraph;
  if (graph?.status !== "ready") return undefined;
  const nodes = new Map(graph.nodes.map((node) => [node.nodeId, node]));
  const source = nodes.get(sourceNodeId);
  const target = nodes.get(targetNodeId);
  if (!source || !target || source.domain !== "ground" || target.domain !== "ground") return false;
  if (source.knowledge === "unknown" || target.knowledge === "unknown") return false;
  if (source.clearance < 1 || target.clearance < 1) return false;
  const queue = [sourceNodeId];
  const visited = new Set(queue);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current === targetNodeId) return true;
    for (const link of graph.links) {
      if (
        link.domain !== "ground" ||
        link.knowledge === "unknown" ||
        link.clearance < 1 ||
        (link.fromNodeId !== current && (link.directional || link.toNodeId !== current))
      )
        continue;
      const next = link.toNodeId;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return false;
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

function airWeaponRange(member: AiObservedActorV1, target: Vector3Simple): number | undefined {
  if (!member.capabilities.some((capability) => capability.domains.includes("air"))) return undefined;
  const profile = member.combatProfile?.status === "known" ? member.combatProfile.value : null;
  if (!profile?.attacks.length) return undefined;
  const origin = member.logicalPosition.status === "known" ? member.logicalPosition.value : null;
  return Math.max(
    ...profile.attacks.map((attack) => attack.range + (origin && origin.z > target.z ? attack.highGroundRangeBonus : 0))
  );
}

function airApproachPosition(
  member: AiObservedActorV1,
  target: Vector3Simple,
  range: number
): Vector3Simple | undefined {
  const origin = member.logicalPosition.status === "known" ? member.logicalPosition.value : null;
  if (!origin) return undefined;
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const separation = Math.hypot(dx, dy);
  const desiredRange = Math.max(1, range - 1);
  if (separation <= desiredRange) return origin;
  const fraction = (separation - desiredRange) / separation;
  return {
    x: Math.round(origin.x + dx * fraction),
    y: Math.round(origin.y + dy * fraction),
    z: target.z
  };
}

/** Picks distinct observed passable cells near an occupied objective; the building center is never a move order. */
export function selectAiAttackApproachPositions(
  members: readonly AiObservedActorV1[],
  target: Vector3Simple,
  observation: AiObservationV1,
  targetFootprintRadiusTiles = 0
): NonNullable<AiSquadStateV1["tactics"]>["assignedPositions"] {
  const origin = members[0]?.logicalPosition.status === "known" ? members[0].logicalPosition.value : target;
  const candidates = (observation.map?.tacticalCells ?? observation.map?.constructionCells ?? [])
    .filter(
      (cell) =>
        distance(cell.position, target) <= 16 &&
        (cell.position.x !== target.x || cell.position.y !== target.y) &&
        (Math.abs(cell.position.x - target.x) > targetFootprintRadiusTiles ||
          Math.abs(cell.position.y - target.y) > targetFootprintRadiusTiles) &&
        !cell.observedBlocked
    )
    .sort(
      (left, right) =>
        distance(left.position, target) * 10 +
          distance(left.position, origin) -
          (distance(right.position, target) * 10 + distance(right.position, origin)) ||
        left.tileKey.localeCompare(right.tileKey)
    );
  const used = new Set<string>();
  return members.flatMap((member) => {
    const domains = new Set(member.capabilities.flatMap((capability) => capability.domains));
    const range = airWeaponRange(member, target);
    const candidatesForMember =
      range === undefined
        ? candidates
        : candidates.filter(
            (candidate) => Math.hypot(candidate.position.x - target.x, candidate.position.y - target.y) <= range - 1
          );
    const cell = candidatesForMember.find((candidate) => {
      if (used.has(candidate.tileKey)) return false;
      if (
        !(
          domains.has("air") ||
          (domains.has("water") && candidate.waterPassable) ||
          (domains.has("ground") && candidate.groundPassable)
        )
      )
        return false;
      if (
        domains.has("ground") &&
        member.accessNodeId.status === "known" &&
        observation.map?.accessGraph?.status === "ready"
      ) {
        if (!candidate.groundAccessNodeId) return false;
        if (hasKnownGroundRoute(member.accessNodeId.value, candidate.groundAccessNodeId, observation) !== true)
          return false;
      }
      return !observation.effects.some(
        (effect) =>
          effect.influence === "harmful" && distance(effect.position, candidate.position) <= (effect.radius ?? 0) + 1
      );
    });
    if (!cell && range !== undefined) {
      const position = airApproachPosition(member, target, range);
      return position ? [{ actorId: member.actorId, position }] : [];
    }
    if (!cell) return [];
    used.add(cell.tileKey);
    return [{ actorId: member.actorId, position: cell.position }];
  });
}

/** Selects a safe firing position, or a retreat for an isolated critical ranged unit. */
export function selectAiSafeFiringPositions(
  members: readonly AiObservedActorV1[],
  enemies: readonly AiObservedActorV1[],
  target: AiObservedActorV1 | null | undefined,
  observation: AiObservationV1
): NonNullable<AiSquadStateV1["tactics"]>["assignedPositions"] {
  const targetPosition = knownPosition(target ?? undefined);
  if (!target || !targetPosition) return [];
  const cells = observation.map?.tacticalCells ?? observation.map?.constructionCells ?? [];
  const used = new Set<string>();
  const criticalMemberCount = members.filter(
    (member) => member.healthPermille?.status === "known" && member.healthPermille.value <= 300
  ).length;
  return members.flatMap((member) => {
    const health = member.healthPermille;
    const profile = member.combatProfile?.status === "known" ? member.combatProfile.value : null;
    const origin = knownPosition(member);
    if (health?.status !== "known" || health.value > 400 || !profile || !origin || !enemies.length) return [];
    const domains = movementDomains(member);
    const attacks = profile.attacks.filter(
      (attack) =>
        attack.damage > 0 &&
        attack.minRange > 0 &&
        movementDomains(target).some((domain) => attack.targetDomains.includes(domain))
    );
    if (!attacks.length) return [];

    const candidates = [
      { position: origin, tileKey: `${origin.x},${origin.y}` },
      ...cells.map((cell) => ({ position: cell.position, tileKey: cell.tileKey }))
    ]
      .filter((candidate) => legalForMembers(candidate.position, observation, [member]))
      .sort(
        (left, right) =>
          distance(left.position, origin) - distance(right.position, origin) ||
          left.tileKey.localeCompare(right.tileKey)
      );
    const selected = candidates
      .flatMap((candidate) => {
        if (used.has(candidate.tileKey)) return [];
        const targetDistance = distance(candidate.position, targetPosition);
        const canFire = attacks.some(
          (attack) =>
            targetDistance >= attack.minRange &&
            targetDistance <= attack.range + (candidate.position.z > targetPosition.z ? attack.highGroundRangeBonus : 0)
        );
        if (!canFire) return [];
        const threatDistances: number[] = [];
        const safe = enemies.every((enemy) => {
          const enemyPosition = knownPosition(enemy);
          const enemyProfile = enemy.combatProfile?.status === "known" ? enemy.combatProfile.value : null;
          if (!enemyPosition || !enemyProfile) return false;
          const separation = distance(candidate.position, enemyPosition);
          const relevantAttacks = enemyProfile.attacks.filter(
            (attack) => attack.damage > 0 && domains.some((domain) => attack.targetDomains.includes(domain))
          );
          if (relevantAttacks.length) threatDistances.push(separation);
          return !relevantAttacks.some(
            (attack) =>
              separation >= attack.minRange &&
              separation <=
                attack.range + (enemyPosition.z > candidate.position.z ? attack.highGroundRangeBonus : 0) + 2
          );
        });
        if (!safe) return [];
        return [
          {
            ...candidate,
            nearestThreatDistance: threatDistances.length ? Math.min(...threatDistances) : Number.POSITIVE_INFINITY,
            travelDistance: distance(candidate.position, origin)
          }
        ];
      })
      .sort(
        (left, right) =>
          left.travelDistance - right.travelDistance ||
          right.nearestThreatDistance - left.nearestThreatDistance ||
          left.tileKey.localeCompare(right.tileKey)
      );
    const bestPosition = selected[0];
    if (!bestPosition && health.value <= 300 && criticalMemberCount <= Math.max(1, Math.floor(members.length / 2))) {
      const knownThreats = enemies.flatMap((enemy) => {
        const enemyPosition = knownPosition(enemy);
        const enemyProfile = enemy.combatProfile?.status === "known" ? enemy.combatProfile.value : null;
        const attacks =
          enemyProfile?.attacks.filter(
            (attack) => attack.damage > 0 && domains.some((domain) => attack.targetDomains.includes(domain))
          ) ?? [];
        return enemyPosition && attacks.length ? [{ position: enemyPosition }] : [];
      });
      if (knownThreats.length) {
        const retreat = candidates
          .filter((candidate) => !used.has(candidate.tileKey))
          .map((candidate) => ({
            ...candidate,
            nearestThreatDistance: Math.min(
              ...knownThreats.map((threat) => distance(candidate.position, threat.position))
            )
          }))
          .sort(
            (left, right) =>
              right.nearestThreatDistance - left.nearestThreatDistance ||
              distance(left.position, origin) - distance(right.position, origin) ||
              left.tileKey.localeCompare(right.tileKey)
          )[0];
        if (retreat) {
          used.add(retreat.tileKey);
          return [{ actorId: member.actorId, position: retreat.position }];
        }
      }
    }
    if (!bestPosition) {
      if (health.value > 100) return [];
      const knownThreats = enemies.flatMap((enemy) => {
        const enemyPosition = knownPosition(enemy);
        const enemyProfile = enemy.combatProfile?.status === "known" ? enemy.combatProfile.value : null;
        const attacks =
          enemyProfile?.attacks.filter(
            (attack) => attack.damage > 0 && domains.some((domain) => attack.targetDomains.includes(domain))
          ) ?? [];
        return enemyPosition && attacks.length ? [{ position: enemyPosition, attacks }] : [];
      });
      if (!knownThreats.length) return [];
      const nearestThreatDistance = (position: Vector3Simple) =>
        Math.min(...knownThreats.map((threat) => distance(position, threat.position)));
      const currentThreatDistance = nearestThreatDistance(origin);
      const currentlyInWeaponRange = knownThreats.some((threat) => {
        const separation = distance(origin, threat.position);
        return threat.attacks.some(
          (attack) =>
            separation >= attack.minRange &&
            separation <= attack.range + (threat.position.z > origin.z ? attack.highGroundRangeBonus : 0)
        );
      });
      if (!currentlyInWeaponRange) return [];
      const fallback = candidates
        .filter((candidate) => !used.has(candidate.tileKey) && distance(candidate.position, origin) > 1)
        .map((candidate) => ({
          ...candidate,
          nearestThreatDistance: nearestThreatDistance(candidate.position)
        }))
        .filter((candidate) => candidate.nearestThreatDistance > currentThreatDistance)
        .sort(
          (left, right) =>
            right.nearestThreatDistance - left.nearestThreatDistance ||
            distance(left.position, origin) - distance(right.position, origin) ||
            left.tileKey.localeCompare(right.tileKey)
        )[0];
      if (!fallback) return [];
      used.add(fallback.tileKey);
      return [{ actorId: member.actorId, position: fallback.position }];
    }
    used.add(bestPosition.tileKey);
    return [{ actorId: member.actorId, position: bestPosition.position }];
  });
}

/** Reads native definition footprint when the objective is a known building; unknown actors use no extra margin. */
export function targetFootprintRadiusTiles(
  target: AiObservedActorV1 | null | undefined,
  catalog: AiCapabilityCatalogV1 | undefined
): number {
  if (!target || !catalog) return 0;
  return Math.max(
    0,
    ...catalog.entries
      .filter((entry) => entry.sourceObjectName === target.objectName)
      .map((entry) => entry.constructionProfile?.footprintRadiusTiles ?? 0)
  );
}
