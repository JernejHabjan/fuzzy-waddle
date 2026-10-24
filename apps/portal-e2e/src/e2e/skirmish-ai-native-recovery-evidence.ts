import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Native recovery effects stay attached to their original actor/target/resource; aggregate busyness is insufficient. */
export function nativeRecoveryIncome(
  context: Pick<ReturnType<typeof nativeScenarioContext>, "capture" | "frames"> &
    Partial<Pick<ReturnType<typeof nativeScenarioContext>, "roles">>, after = 0, worker?: string,
  source = "own-source", type = ResourceType.Wood, owner: number | null = null) {
  const sourceActorId = context.roles?.[source];
  return !!sourceActorId && hasNativeSourceDelivery(context.capture?.facts ?? [], {
    sourceActorId, sourceOwner: owner, playerNumber: 2, resourceType: type,
    fromTick: after, throughTick: context.frames.at(-1)?.tick ?? 0, workerActorId: worker
  });
}

/** Keep the initial mission identity and its independently due milestone instead of adopting every replacement's estimate. */
export function nativeRecoveryObligation(context: ReturnType<typeof nativeScenarioContext>, actorId: string) {
  for (const frame of context.frames) {
    const squad = frame.decision.missionState?.squads.find((entry) => entry.actorIds.includes(actorId) &&
      ["attack", "reinforcement", "scout"].includes(entry.role) && !!entry.lifecycle);
    if (squad?.lifecycle) return { frame, squad, deadline: Math.min(2000, squad.lifecycle.effectDeadline.dueTick) };
  }
  return undefined;
}

/** Recovery state is explanatory only; a later real original-actor arrival, income or objective hit is still required. */
export function nativeRecoveryDeadlineFailures(context: ReturnType<typeof nativeScenarioContext>, role = "army-0") {
  const failures: string[] = [], actorId = context.role(role), obligation = nativeRecoveryObligation(context, actorId);
  if (!actorId || !obligation || obligation.frame.tick > 400) return ["recovery_original_obligation_premise_missing"];
  const planId = `plan:${obligation.squad.squadId}`;
  const records = context.frames.flatMap((frame) => (frame.decision.missionState?.recovery?.records ?? [])
    .filter((record) => record.actorId === actorId || record.planId === planId).map((record) => ({ frame, record })));
  if (!records.length) failures.push("recovery_original_causal_record_missing");
  const first = records[0];
  if (first && records.some(({ record }) => record.recoveryKey === first.record.recoveryKey &&
    (record.enteredTick !== first.record.enteredTick || record.phaseDeadline.dueTick !== first.record.phaseDeadline.dueTick ||
      record.attempt < first.record.attempt))) failures.push("recovery_causal_age_or_deadline_reset");
  const original = obligation.squad;
  const changed = context.frames.find((frame) => frame.tick > obligation.frame.tick && frame.tick <= obligation.deadline &&
    frame.decision.missionState?.squads.some((squad) => squad.squadId === original.squadId &&
      (squad.lifecycle?.recoveryAttempt ?? 0) > (original.lifecycle?.recoveryAttempt ?? 0) ||
      squad.actorIds.includes(actorId) && squad.objectiveId !== original.objectiveId ||
      squad.squadId === original.squadId && ["completed", "cancelled", "recover", "recovering"].includes(squad.state)));
  const episode = context.frames.some((frame) => frame.tick <= obligation.deadline &&
    frame.decision.missionState?.recoveryEpisodes.some((entry) => entry.startedTick >= obligation.frame.tick &&
      frame.decision.missionState?.blockers?.some((blocker) => blocker.blockerId === entry.blockerId && blocker.planId === planId)));
  if (!changed && !episode) failures.push("recovery_no_bounded_original_purpose_escalation");
  const restored = nativeWeaponHits(context).some((fact) =>
    fact.kind === "native_damage" && fact.damage.initiator?.actorId === actorId && fact.tick >= 2400);
  if (!restored) failures.push("recovery_original_actor_never_restored_to_native_useful_duty");
  return failures;
}

/** Every forced premise must be observed on its pinned original actor; failed adapter dispatch alone never establishes it. */
export function nativeRecoveryCommonFailures(context: Pick<ReturnType<typeof nativeScenarioContext>, "frames" | "capture">) {
  const failures: string[] = [];
  if (context.frames.some((frame) => !frame.decision.missionState?.recovery || !frame.decision.missionState.blockers ||
      !frame.decision.missionState.transport)) failures.push("recovery_complete_selected_ownership_missing");
  if (context.frames.some((frame) => frame.decision.acceptedIntents.some((intent) => intent.kind === "concede")))
    failures.push("recovery_technical_or_optional_failure_caused_concession");
  if (!nativeRecoveryIncome(context)) failures.push("recovery_unrelated_native_income_missing");
  return failures;
}
