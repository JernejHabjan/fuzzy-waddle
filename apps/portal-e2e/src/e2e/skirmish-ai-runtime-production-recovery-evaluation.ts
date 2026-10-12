import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import { productionActorRetained, productionWorldAt } from "./skirmish-ai-runtime-production-authority-evaluation";
import { runtimeProductionUsefulOutputs } from "./skirmish-ai-runtime-production-useful-output";
import { runtimeProductionBuilderWork } from "./skirmish-ai-runtime-production-builder-work";

/** Exact current fair native pairs, not universal 2D ranges. Unavailable bindings never classify a producer as safe. */
export function runtimeProductionExposure(evidence: RuntimeProductionEvidenceV2, actorId: string, tick: number) {
  const world = productionWorldAt(evidence, tick);
  const binding = world?.exposure;
  const decision = evidence.decisions.find((entry) => entry.selectedSequence === binding?.selectedSequence);
  const input = decision?.result.input;
  const exposure = input?.producerExposure;
  if (
    !binding?.validProducerIds?.includes(actorId) ||
    !decision ||
    decision.inputTick !== decision.selectedTick ||
    !exposure ||
    exposure.gaps.length
  )
    return "unavailable";
  const threats =
    input?.observation?.actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible") ?? [];
  const pairs = exposure.pairs.filter((pair) => pair.producerActorId === actorId);
  if (
    pairs.length !== threats.length ||
    pairs.some((pair) => pair.status === "unavailable") ||
    !input?.observation?.actors.some((actor) => actor.actorId === actorId && actor.relation === "self")
  )
    return "unavailable";
  return pairs.some((pair) => pair.status === "known" && pair.withinSelectedWeaponBand) ? "exposed" : "safe";
}

/** Requires a distinct, actually ready replacement before pinned loss and its own useful post-loss output. */
export function evaluateRuntimeProductionRecovery(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV2
) {
  const decision = evidence.decisions.find(
    (entry) =>
      entry.inputTick === entry.selectedTick &&
      entry.result.input?.producerExposure &&
      entry.result.opening?.plan.steps.length &&
      entry.result.opening.plan.steps.every((checkpoint) => ["completed", "skipped"].includes(checkpoint.state)) &&
      entry.result.input.observation?.actors.some(
        (actor) =>
          actor.relation === "enemy" &&
          actor.visibility === "visible" &&
          actor.combatProfile?.status === "known" &&
          actor.combatProfile.value.attacks.some(
            (attack) => attack.damage > 0 && attack.targetDomains.includes("ground")
          )
      )
  );
  if (
    !decision ||
    !decision.result.input?.observation?.actors.some(
      (actor) =>
        actor.relation === "enemy" &&
        actor.visibility === "visible" &&
        actor.combatProfile?.status === "known" &&
        actor.combatProfile.value.attacks.some((attack) => attack.damage > 0 && attack.targetDomains.includes("ground"))
    )
  ) {
    return ["production_v2_resilience_fair_input_missing"];
  }
  const world = productionWorldAt(evidence, decision.selectedTick);
  const producers =
    world?.actors.filter(
      (actor) =>
        actor.identity.canonicalObjectName === contract.producerObjectName &&
        actor.identity.finished &&
        actor.identity.alive
    ) ?? [];
  const producer = producers[0]?.identity.actorId;
  if (producers.length !== 1 || !producer) return ["production_v2_resilience_initial_capacity_invalid"];
  const exposure = runtimeProductionExposure(evidence, producer, decision.selectedTick);
  if (exposure !== (contract.branch === "safe_served" ? "safe" : "exposed"))
    return ["production_v2_resilience_causal_geometry"];
  const strategy = decision.result.strategy;
  if (!strategy || decision.result.economyProduction.posture?.status === "emergency") {
    return ["production_v2_resilience_demand_unavailable"];
  }
  const assessment = strategy.assessment;
  const required = assessment && ["pressure", "finish"].includes(assessment.choice) ? assessment.requiredForce : 0;
  const served =
    world?.actors.filter(
      (actor) =>
        actor.identity.canonicalObjectName === contract.productKey && actor.identity.alive && actor.identity.finished
    ).length ?? 0;
  if (
    !Number.isSafeInteger(required) ||
    required < 0 ||
    (["critical_exposed", "safe_served"].includes(contract.branch) && required <= served) ||
    (contract.branch === "low_value" && (required === 0 || required > served)) ||
    (contract.branch === "no_demand" && required !== 0)
  )
    return ["production_v2_resilience_causal_demand"];
  const construction = evidence.lifecycle.construction.filter(
    (entry) =>
      entry.placement?.spatial.kind === "placement" &&
      entry.placement.spatial.command.actorName === contract.producerObjectName
  );
  if (contract.branch !== "critical_exposed") {
    return construction.length ? ["production_v2_needless_redundancy"] : [];
  }
  const loss = evidence.lifecycle.losses.find((entry) => entry.actorId === producer);
  if (
    !loss ||
    loss.actor?.alive !== false ||
    productionWorldAt(evidence, loss.tick)?.actors.some(
      (actor) => actor.identity.actorId === producer && actor.identity.alive
    )
  )
    return ["production_v2_original_loss_missing"];
  if (
    evidence.coverage?.intervals
      .filter((interval) => interval.closedThroughTick >= loss.tick)
      .some((interval) => interval.actors.some((actor) => actor.identity.actorId === producer))
  )
    return ["production_v2_original_loss_not_retained"];
  const ready = construction.find(
    (entry) =>
      entry.boundary.construction.kind === "lifecycle" &&
      entry.boundary.construction.transition === "finished" &&
      entry.boundary.tick < loss.tick
  );
  const replacement = ready?.boundary.construction.site.actorId;
  const safe =
    ready && replacement
      ? evidence.coverage?.intervals.find(
          (interval) =>
            interval.closedFromTick > ready.boundary.tick &&
            interval.closedThroughTick < loss.tick &&
            runtimeProductionExposure(evidence, replacement, interval.closedFromTick) === "safe"
        )
      : undefined;
  const failures: string[] = [];
  if (
    !ready ||
    !replacement ||
    replacement === producer ||
    !safe ||
    !productionActorRetained(evidence, replacement, ready.boundary.tick + 1, contract.latestTick) ||
    !runtimeProductionBuilderWork(evidence, replacement) ||
    evidence.coverage?.intervals
      .filter((interval) => interval.closedThroughTick >= safe.closedFromTick)
      .some((interval) => runtimeProductionExposure(evidence, replacement, interval.closedThroughTick) !== "safe")
  ) {
    failures.push("production_v2_safe_replacement_history_missing");
  }
  if (
    !runtimeProductionUsefulOutputs(evidence, contract).some(
      (output) =>
        output.completion.actorId === replacement &&
        output.completion.authorityTick >= loss.tick &&
        output.completion.createdActor?.canonicalObjectName === contract.productKey
    )
  )
    failures.push("production_v2_recovery_output_missing");
  return failures;
}
