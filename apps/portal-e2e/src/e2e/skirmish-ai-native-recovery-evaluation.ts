import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeRecoveryCommonFailures, nativeRecoveryDeadlineFailures, nativeRecoveryIncome,
  nativeRecoveryObligation } from "./skirmish-ai-native-recovery-evidence";
import { evaluateNativeMissionRecovery } from "./skirmish-ai-native-mission-recovery-evaluation";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Fail closed on missing native premises before interpreting deadlines or a reassuring recovery trace. */
export function evaluateNativeRecovery(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeRecoveryCommonFailures(context);
  if (["H-24", "H-25", "H-26"].includes(id)) failures.push(...evaluateNativeMissionRecovery(id, branch, context));
  else if (id === "H-03") failures.push(...healthyWorkFailures(branch, context));
  else if (id === "H-19") failures.push(...optionalQueryFailures(branch, context));
  else if (["H-01", "H-02", "H-04"].includes(id)) {
    const early = ["clears_early", "relevant_child"].includes(branch);
    if (!context.result.perturbations.some((event) => event.id === "loss-recovery-door" &&
      event.affectedActorId === context.role("recovery-door") && event.tick === (early ? 400 : 2400)))
      failures.push("recovery_pinned_obstruction_release_missing");
    if (!context.result.perturbations.some((event) => event.id === "original-route-outage" && event.tick <= 400))
      failures.push("recovery_original_failed_query_not_exercised");
    if (early) {
      if (!context.arrived(context.role("army-0"), 400).length)
        failures.push("recovery_early_clear_control_has_no_native_continuation");
    } else if (!(id === "H-04" && branch === "income_parent")) failures.push(...nativeRecoveryDeadlineFailures(context));
    if (id === "H-02") failures.push(...falseProgressFailures(branch, context));
    if (id === "H-04") failures.push(...parentProgressFailures(branch, context));
  } else failures.push("recovery_native_case_reader_missing");
  return [...new Set(failures)];
}

/** Work exceeding 200 ticks must retain its original paid identity and finish natively without watchdog cancellation. */
function healthyWorkFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [];
  if (branch === "training") {
    const initial = context.result.presetInitialQueueItems, output = nativePaidMissionOutputs(context);
    if (initial.length !== 4) failures.push("recovery_healthy_original_paid_queue_missing");
    const last = initial.at(-1);
    if (!last || !output.some((entry) => entry.item.itemId === last.itemId && entry.fact.tick > 200))
      failures.push("recovery_healthy_long_queue_did_not_complete_original_item");
    if (initial.some((item) => !output.some((entry) => entry.item.itemId === item.itemId)) ||
        context.facts.some((fact) => fact.kind === "queue_mutation" && fact.mutation.operation === "cancel_remove" &&
          initial.some((item) => item.itemId === fact.mutation.item?.itemId)))
      failures.push("recovery_watchdog_cancelled_or_lost_healthy_paid_work");
    const samples = context.facts.filter((fact) => fact.kind === "queue_progress" && fact.progress.phase === "advanced" &&
      initial.some((item) => item.itemId === fact.progress.item?.itemId) && fact.tick > 200 && !fact.progress.gaps.length);
    if (!samples.some((fact) => fact.kind === "queue_progress" && fact.progress.item &&
      fact.progress.item.remainingTimeMs < fact.progress.remainingBeforeMs)) failures.push("recovery_real_long_queue_progress_missing");
  } else if (branch === "crop") {
    const growing = context.frames.find((frame) => frame.decision.input?.observation?.actors.some((actor) =>
      actor.actorId === context.role("healthy-field") && actor.resourceState.status === "known" &&
      actor.resourceState.value.growthReadyTick.status === "known" &&
      actor.resourceState.value.growthReadyTick.value > frame.tick + 200));
    if (!growing || !nativeRecoveryIncome(context, growing.tick + 200, context.role("worker-0"),
      "healthy-field", ResourceType.Food, 2)) failures.push("recovery_original_crop_growth_and_delivered_harvest_missing");
  } else {
    const actor = context.role("army-0"), arrived = context.arrived(actor).filter((movement) =>
      branch !== "stalled" || (movement.observations.at(-1)?.tick ?? 0) > 1001);
    if (branch === "travel" && !arrived.some((movement) =>
      (movement.observations.at(-1)?.tick ?? 0) - movement.started.tick > 200))
      failures.push("recovery_healthy_travel_did_not_exceed_200_ticks_and_arrive");
    if (branch === "stalled" && (!context.result.perturbations.some((event) => event.id === "healthy-matched-outage") ||
        !arrived.length || !context.frames.some((frame) => frame.decision.missionState?.recovery?.records.some((record) =>
          record.actorId === actor || record.domain === "squad"))))
      failures.push("recovery_stalled_matched_control_never_recovered");
  }
  return failures;
}

/** The authored pending/error seam must actually intercept; nearby native defense has to execute during that fixed fault. */
function optionalQueryFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], end = branch === "late" ? 600 : 1001;
  const fault = context.result.perturbations.find((event) => event.id === "optional-query-outage" &&
    event.affectedActorId === context.role("army-0"));
  const defense = nativeWeaponHits(context, context.role("local-attacker"), 200).find((fact) => fact.tick <= end);
  if (!fault || !defense || fault.tick >= defense.tick) failures.push("recovery_local_defense_not_effective_during_optional_query_fault");
  if (!context.facts.some((fact) => fact.kind === "native_damage" && fact.damage.initiator?.actorId ===
      context.role("local-attacker") && fact.damage.target.actorId === context.role("worker-0") && fact.tick <= end))
    failures.push("recovery_real_local_attack_premise_missing");
  if (!context.arrived(context.role("army-0")).some((movement) => (movement.observations.at(-1)?.tick ?? 0) > end))
    failures.push("recovery_original_optional_query_never_resumed_after_fixed_release");
  return failures;
}

/** Repeated motion and replacement names cannot supply meaningful evidence for the original blocked purpose. */
function falseProgressFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], actor = context.role(branch === "circling_worker" ? "worker-0" : "army-0");
  const positions = context.frames.filter((frame) => frame.tick <= 1200).flatMap((frame) =>
    frame.tacticalBoundary?.actors.filter((entry) => entry.identity.actorId === actor && !!entry.tile)
      .map((entry) => `${entry.tile?.x},${entry.tile?.y}`) ?? []);
  if (new Set(positions).size < 3) failures.push("recovery_false_motion_control_not_physically_exercised");
  if (branch === "renamed_purpose") {
    const squads = context.frames.flatMap((frame) => frame.tick <= 2400 ? frame.decision.missionState?.squads
      .filter((squad) => squad.actorIds.includes(actor) && squad.role === "attack") ?? [] : []);
    const ages = squads.filter((squad) => squad.objectiveId === squads[0]?.objectiveId)
      .map((squad) => squad.lifecycle?.createdTick);
    if (new Set(ages).size > 1) failures.push("recovery_renamed_same_purpose_erased_cumulative_age");
  }
  return failures;
}

/** Freeze the parent before unrelated native income; unrelated child effects cannot slide that parent's original deadline. */
function parentProgressFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  if (branch === "relevant_child") return [];
  if (branch === "income_parent") return incomeParentFailures(context);
  const obligation = nativeRecoveryObligation(context, context.role("army-0"));
  const failures: string[] = [];
  if (!obligation || !nativeRecoveryIncome(context, obligation.frame.tick))
    failures.push("recovery_unrelated_child_progress_premise_missing");
  const original = obligation?.squad;
  if (original && context.frames.some((frame) => frame.tick < 2400 && frame.decision.missionState?.squads.some((squad) =>
    squad.squadId === original.squadId && squad.lifecycle && original.lifecycle &&
    squad.lifecycle.effectDeadline.dueTick > original.lifecycle.effectDeadline.dueTick)))
    failures.push("recovery_unrelated_child_extended_parent_deadline");
  return failures;
}

/** A blocked wood duty is not advanced by a different worker's delivered food, even though both are real income. */
function incomeParentFailures(context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], worker = context.role("worker-0"), source = context.role("blocked-source");
  const original = context.frames.find((frame) => frame.tick <= 400 &&
    frame.decision.input?.observation?.actors.some((actor) => actor.actorId === worker &&
      actor.activeOrder?.status === "known" && actor.activeOrder.value?.targetActorId === source));
  const records = context.frames.flatMap((frame) => frame.tick < 2400 ?
    frame.decision.missionState?.recovery?.records.filter((record) => record.actorId === worker)
      .map((record) => ({ frame, record })) ?? [] : []);
  const first = records[0];
  if (!original || !first) failures.push("recovery_original_blocked_income_ownership_missing");
  if (!nativeRecoveryIncome(context, 0, context.role("worker-1"), "unrelated-field", ResourceType.Food, 2))
    failures.push("recovery_unrelated_different_resource_child_not_delivered");
  if (first && records.some(({ record }) => record.recoveryKey === first.record.recoveryKey &&
      (record.enteredTick !== first.record.enteredTick || record.phaseDeadline.dueTick !== first.record.phaseDeadline.dueTick ||
        record.lastProgressTick > first.record.lastProgressTick))) failures.push("recovery_unrelated_food_refreshed_blocked_wood_parent");
  if (!records.some(({ frame, record }) => frame.tick <= 2000 && record.attempt > 0 &&
      ["recovering", "abandoned", "backoff"].includes(record.state))) failures.push("recovery_blocked_income_parent_never_escalated");
  if (!nativeRecoveryIncome(context, 2400, worker, "blocked-source"))
    failures.push("recovery_original_income_worker_never_resumed_delivered_duty");
  return failures;
}
