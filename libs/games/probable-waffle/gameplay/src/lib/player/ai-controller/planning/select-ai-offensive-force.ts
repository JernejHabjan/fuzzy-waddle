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
    const navalShoreFiringNodes =
      domains(leader).includes("water") && (opponentDomains.length === 0 || opponentDomains.includes("ground"))
        ? graph.transferPoints
            .filter(
              (transfer) =>
                transfer.kind === "shore" &&
                transfer.fromNodeId === targetNode &&
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
  const direct = attempts.filter(
    (attempt) =>
      attempt.route.kind === "direct" ||
      (attempt.route.kind === "air_or_naval_objective" &&
        (attempt.route.domain === "air" ||
          (attempt.route.domain === "water" && attempt.group.some((actor) => domains(actor).includes("water")))))
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
