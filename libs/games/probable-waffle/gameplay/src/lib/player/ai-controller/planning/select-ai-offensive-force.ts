import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { canTarget, distance, domains, node, position, routeCapability } from "./ai-skirmish-support";

function targetAccessNode(context: AiSkirmishProposalContext, opponent: AiObservedActorV1) {
  const observedNode = node(opponent);
  if (observedNode) return observedNode;
  if (opponent.visibility !== "last_seen") return undefined;

  const graph = context.observation.map?.accessGraph;
  const lastKnownPosition = position(opponent);
  if (!graph || !lastKnownPosition) return undefined;

  const catalogDomains =
    context.catalog?.entries
      .filter((entry) => entry.sourceObjectName === opponent.objectName)
      .flatMap((entry) => entry.movementDomains) ?? [];
  const targetDomains = [...new Set([...domains(opponent), ...catalogDomains])].sort();
  const domainsToSearch = targetDomains.length > 0 ? targetDomains : ["ground"];
  return graph.nodes
    .filter((candidate) => domainsToSearch.includes(candidate.domain) && candidate.knowledge !== "unknown")
    .sort(
      (left, right) =>
        distance(left.representativePosition, lastKnownPosition) -
          distance(right.representativePosition, lastKnownPosition) || left.nodeId.localeCompare(right.nodeId)
    )[0]?.nodeId;
}

function routeDomain(route: ReturnType<typeof queryAiAccessRouteV1>): "air" | "ground" | "water" | undefined {
  return route.kind === "direct" || route.kind === "air_or_naval_objective" ? route.domain : undefined;
}

function navalTargetFiringRange(attackers: readonly AiObservedActorV1[], opponent: AiObservedActorV1): number {
  const targetDomains = domains(opponent);
  return Math.max(
    0,
    ...attackers.flatMap((actor) =>
      domains(actor).includes("water") && actor.combatProfile?.status === "known"
        ? actor.combatProfile.value.attacks
            .filter(
              (attack) =>
                targetDomains.length === 0 ||
                targetDomains.some((targetDomain) => attack.targetDomains.includes(targetDomain))
            )
            .map((attack) => attack.range)
        : []
    )
  );
}

export function selectAiNavalShoreFiringPosition(
  context: AiSkirmishProposalContext,
  opponent: AiObservedActorV1,
  waterNodeId: string
) {
  const graph = context.observation.map?.accessGraph;
  if (!graph) return undefined;
  const targetPosition = position(opponent);
  const targetNodeId = node(opponent);
  const firingRange = navalTargetFiringRange(context.combat, opponent);
  return graph.transferPoints
    .filter(
      (transfer) =>
        transfer.kind === "shore" &&
        transfer.toNodeId === waterNodeId &&
        transfer.knowledge !== "unknown" &&
        (transfer.fromNodeId === targetNodeId ||
          (opponent.visibility === "last_seen" &&
            targetPosition !== undefined &&
            distance(transfer.passengerPosition, targetPosition) <= firingRange))
    )
    .sort(
      (left, right) =>
        (targetPosition ? distance(left.passengerPosition, targetPosition) : 0) -
          (targetPosition ? distance(right.passengerPosition, targetPosition) : 0) ||
        left.transferId.localeCompare(right.transferId)
    )[0]?.carrierPosition;
}

function selectAiNavalWaterFiringPosition(
  context: AiSkirmishProposalContext,
  opponent: AiObservedActorV1
) {
  const targetPosition = position(opponent);
  if (!targetPosition) return undefined;
  const attackers = context.combat.filter((actor) => domains(actor).includes("water") && canTarget(actor, opponent));
  const candidates = (context.observation.map?.tacticalCells ?? [])
    .filter((cell) => cell.waterPassable && !cell.observedBlocked && distance(cell.position, targetPosition) > 0)
    .filter((cell) =>
      attackers.some((actor) => {
        const attacks = actor.combatProfile?.status === "known" ? actor.combatProfile.value.attacks : [];
        const targetDomains = domains(opponent);
        const separation = distance(cell.position, targetPosition);
        return attacks.some(
          (attack) =>
            attack.damage > 0 &&
            targetDomains.some((domain) => attack.targetDomains.includes(domain)) &&
            separation >= attack.minRange &&
            separation <= attack.range + (cell.position.z > targetPosition.z ? attack.highGroundRangeBonus : 0)
        );
      })
    );
  const distanceFromNavalForce = (candidate: (typeof candidates)[number]) =>
    Math.min(...attackers.map((actor) => distance(position(actor) ?? candidate.position, candidate.position)));
  return candidates
    .sort(
      (left, right) =>
        distanceFromNavalForce(left) - distanceFromNavalForce(right) ||
        distance(left.position, targetPosition) - distance(right.position, targetPosition) ||
        left.tileKey.localeCompare(right.tileKey)
    )[0]?.position;
}

export function selectAiNavalFiringPosition(
  context: AiSkirmishProposalContext,
  opponent: AiObservedActorV1,
  waterNodeId: string
) {
  return domains(opponent).includes("water")
    ? selectAiNavalWaterFiringPosition(context, opponent)
    : selectAiNavalShoreFiringPosition(context, opponent, waterNodeId);
}

/** Route each origin/domain separately: one reachable unit cannot certify unreachable reinforcements.
 * Independently direct cohorts can share a mission; transport passengers retain a single executable route.
 */
export function selectAiOffensiveForce(
  context: AiSkirmishProposalContext,
  opponent: AiObservedActorV1,
  attackers: readonly AiObservedActorV1[]
) {
  const graph = context.observation.map?.accessGraph;
  const targetNode = targetAccessNode(context, opponent);
  if (!graph || !targetNode) return undefined;
  const targetPosition = position(opponent);
  const groups = new Map<string, AiObservedActorV1[]>();
  for (const actor of attackers) {
    if (!canTarget(actor, opponent) || !node(actor)) continue;
    const key = `${domains(actor).join(",")}:${node(actor)}`;
    groups.set(key, [...(groups.get(key) ?? []), actor]);
  }
  const attempts = [...groups.values()].flatMap((group) => {
    const leader = group[0];
    const sourceNode = node(leader);
    if (!leader || !sourceNode) return [];
    const opponentDomains = domains(opponent);
    const firingRange = navalTargetFiringRange(group, opponent);
    const navalShoreFiringNodes =
      domains(leader).includes("water") && (opponentDomains.length === 0 || opponentDomains.includes("ground"))
        ? graph.transferPoints
            .filter(
              (transfer) =>
                transfer.kind === "shore" &&
                (transfer.fromNodeId === targetNode ||
                  (opponent.visibility === "last_seen" &&
                    targetPosition !== undefined &&
                    distance(transfer.passengerPosition, targetPosition) <= firingRange)) &&
                transfer.knowledge !== "unknown" &&
                graph.nodes.some((candidate) => candidate.nodeId === transfer.toNodeId && candidate.domain === "water")
            )
            .map((transfer) => transfer.toNodeId)
            .sort()
        : [];
    return [
      {
        group,
        route: queryAiAccessRouteV1(graph, {
          queryId: `query:strategy:${opponent.actorId}:${leader.actorId}:${context.observation.generation}`,
          kind: "firing_position",
          fromNodeId: sourceNode,
          toNodeId: targetNode,
          capabilities: routeCapability(context.observation, group, context.catalog),
          firingNodeIds: navalShoreFiringNodes.length > 0 ? navalShoreFiringNodes : [targetNode]
        })
      }
    ];
  });
  // Ground anti-air can intercept overhead. A water objective still needs an executable naval/transport route.
  const direct = attempts
    .filter(
      (attempt) =>
        attempt.route.kind === "direct" ||
        (attempt.route.kind === "air_or_naval_objective" &&
          (attempt.route.domain === "air" ||
            (attempt.route.domain === "water" && attempt.group.some((actor) => domains(actor).includes("water")))))
    )
    .filter(
      (attempt) =>
        !(
          (domains(opponent).length === 0 || domains(opponent).includes("ground")) &&
          routeDomain(attempt.route) === "water" &&
          attempts.some((other) => other.route.kind === "direct" && routeDomain(other.route) === "ground")
        )
    );
  const first = direct[0];
  if (first) {
    return {
      group: direct.flatMap((attempt) => attempt.group),
      route: first.route
    };
  }
  return attempts
    .filter((attempt) => ["water_transport", "air_transport", "pending"].includes(attempt.route.kind))
    .sort(
      (left, right) =>
        Number(left.route.kind === "pending") - Number(right.route.kind === "pending") ||
        right.group.length - left.group.length ||
        (left.group[0]?.actorId ?? "").localeCompare(right.group[0]?.actorId ?? "")
    )[0];
}
