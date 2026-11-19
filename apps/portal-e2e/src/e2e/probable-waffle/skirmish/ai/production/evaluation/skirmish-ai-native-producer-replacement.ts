import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "../../construction/evaluation/skirmish-ai-native-construction-evidence";
import { nativeRetainedActor } from "../../combat/effects/skirmish-ai-native-combat-effects";

/** The native leg demonstrates one paid recovery; the production planner spec owns the repeated-demand stress window. */
export function evaluateNativeProducerReplacement(
  branch: string,
  context: ReturnType<typeof nativeScenarioContext>
): string[] {
  const original = context.role("producer-1");
  const survivor = context.role("producer-2");
  const producerName = context.result.aiFaction === "Tivara" ? "AnkGuard" : "InfantryInn";
  const readyAtStart =
    context.capture?.frontiers?.intervals[0]?.actors.filter(
      ({ identity }) => identity.canonicalObjectName === producerName && identity.finished && identity.alive
    ) ?? [];
  if (
    readyAtStart.length !== 2 ||
    ![original, survivor].every((id) => readyAtStart.some(({ identity }) => identity.actorId === id))
  )
    return ["producer_replacement_ready_baseline_missing"];
  if (!nativeRetainedActor(context, survivor)) return ["producer_replacement_unrelated_producer_lost"];
  const sites = context.facts.filter(
    (fact) =>
      fact.kind === "spatial_authority" &&
      fact.spatial.kind === "placement" &&
      fact.spatial.command.execution?.source === "ai" &&
      fact.spatial.command.playerNumber === 2 &&
      fact.spatial.legal &&
      fact.spatial.site.canonicalObjectName === producerName
  );
  if (branch === "served") {
    return nativeRetainedActor(context, original) && !sites.length
      ? []
      : ["producer_replacement_unneeded_construction"];
  }
  const loss = context.result.perturbations.find(
    (event) => event.id === "producer-loss" && event.affectedActorId === original && event.dispatchedActors === 1
  );
  if (!loss || nativeRetainedActor(context, original)) return ["producer_replacement_original_loss_missing"];
  const completed = nativeCompletedPlacements(context).filter(
    ({ value }) => value.site.canonicalObjectName === producerName
  );
  const replacement = completed[0];
  if (sites.length !== 1 || completed.length !== 1 || !replacement || replacement.fact.tick < loss.tick) {
    return ["producer_replacement_missing_unique_paid_completion_after_loss"];
  }
  if (
    !context.result.checkpoints.some(
      (checkpoint) =>
        checkpoint.tick >= loss.tick &&
        checkpoint.tick <= replacement.completionTick &&
        checkpoint.demands.some((demand) => demand.demandId === "demand:capacity:first-army" && demand.desired === 2)
    )
  )
    return ["producer_replacement_missing_still_required_capacity"];
  const remaining = (context.capture?.frontiers?.closedThroughTick ?? 0) - replacement.completionTick;
  return remaining >= 240 ? [] : ["producer_replacement_missing_post_completion_window"];
}
