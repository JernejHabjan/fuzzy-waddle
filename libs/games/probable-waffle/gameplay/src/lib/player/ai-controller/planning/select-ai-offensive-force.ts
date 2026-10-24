import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { canTarget, domains, node, routeCapability } from "./ai-skirmish-support";

/** Route each origin/domain separately: one reachable unit cannot certify unreachable reinforcements.
 * Independently direct cohorts can share a mission; transport passengers retain a single executable route.
 */
export function selectAiOffensiveForce(
  context: AiSkirmishProposalContext,
  opponent: AiObservedActorV1,
  attackers: readonly AiObservedActorV1[]
) {
  const graph = context.observation.map?.accessGraph;
  const targetNode = node(opponent);
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
    return [
      {
        group,
        route: queryAiAccessRouteV1(graph, {
          queryId: `query:strategy:${opponent.actorId}:${leader.actorId}:${context.observation.generation}`,
          kind: "firing_position",
          fromNodeId: sourceNode,
          toNodeId: targetNode,
          capabilities: routeCapability(context.observation, group, context.catalog),
          firingNodeIds: [targetNode]
        })
      }
    ];
  });
  const direct = attempts.filter(
    (attempt) => attempt.route.kind === "direct" || attempt.route.kind === "air_or_naval_objective"
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
