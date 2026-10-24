import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeRecoveryCommonFailures } from "./skirmish-ai-native-recovery-evidence";

/** A finite observed topology storm must end in a usable published graph, physical progress and bounded query ownership. */
export function evaluateNativeChurn(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeRecoveryCommonFailures(context);
  if (!context.result.perturbations.some((event) => event.id === "churn-stable-query" && event.tick <= 1001 &&
    event.affectedActorId === context.roles["army-0"])) failures.push("churn_original_pending_route_not_exercised");
  for (let i = 0; i < 6; i++) if (!context.result.perturbations.some((event) => event.id === `loss-churn-wall-${i}` &&
    event.affectedActorId === context.roles[`churn-wall-${i}`] && event.tick === 200 + i * 160))
    failures.push("churn_original_native_topology_change_missing");
  const totalCells = context.capture?.setup?.topology[0];
  const limit = totalCells ? totalCells.width * totalCells.height : 0;
  const generations = context.frames.filter((frame) => frame.tick <= 1000).map((frame) =>
    frame.decision.input?.accessGraph?.dynamicRevision);
  if (!limit || new Set(generations.filter((value) => value !== undefined)).size < 2)
    failures.push("churn_permitted_native_topology_never_changed");
  if (context.frames.some((frame) => {
    const graph = frame.decision.input?.accessGraph, queries = frame.decision.missionState?.queries;
    return !queries || queries.length > 128 || new Set(queries.map((query) => query.queryId)).size !== queries.length ||
      queries.some((query) => query.continuationCursor < 0 || query.continuationCursor > limit) ||
      graph && (graph.continuationCursor < 0 || graph.continuationCursor > limit);
  })) failures.push("churn_query_backlog_cursor_or_ownership_unbounded");
  const stable = context.frames.filter((frame) => frame.tick > 1000 && frame.tick <= 2000);
  if (!stable.some((frame) => frame.decision.input?.accessGraph?.status === "ready") ||
    !context.arrived(context.roles["army-0"], 1000).length)
    failures.push("churn_stable_native_graph_and_original_actor_arrival_missing");
  const milestones = context.capture?.frontiers?.intervals.map((interval) => interval.navigation?.completedRebuild);
  if (!milestones || new Set(milestones.filter((value) => value !== undefined)).size < 2)
    failures.push("churn_actual_completed_navigation_rebuilds_missing");
  if (branch === "dispose") {
    const proof = context.result.nativeDisposal;
    if (!proof || !proof.pendingBeforeShutdown || !proof.settledWithNull || !proof.sceneInactive ||
      !proof.controllerDetached || !proof.nativeCacheCleared) failures.push("churn_pending_query_scene_disposal_not_proven");
  }
  return [...new Set(failures)];
}
