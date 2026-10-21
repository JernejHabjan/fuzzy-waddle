import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { evaluateNativeAuthority } from "./skirmish-ai-native-authority-evaluation";
import { nativeRecoveryCommonFailures } from "./skirmish-ai-native-recovery-evidence";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";

/** Native goal loss cannot erase paid/uncertain work; original released members must physically serve another purpose. */
export function evaluateNativeOptionalRelease(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeRecoveryCommonFailures(context);
  const target = context.roles["authority-target"], alternative = context.roles["release-alternative"];
  const original = context.frames.find((frame) => frame.tick < 400 && frame.decision.missionState?.squads.some((squad) =>
    squad.tactics?.targetActorId === target && squad.actorIds.length > 0));
  const squad = original?.decision.missionState?.squads.find((entry) => entry.tactics?.targetActorId === target && entry.actorIds.length);
  if (!target || !alternative || !squad || !context.result.perturbations.some((event) =>
    event.id === "loss-optional-purpose" && event.tick === 400 && event.affectedActorId === target))
    failures.push("release_actual_original_optional_purpose_and_loss_missing");
  const due = Math.min(2000, squad?.lifecycle?.effectDeadline.dueTick ?? 2000);
  const after = context.frames.filter((frame) => frame.tick > 400 && frame.tick <= due);
  if (!after.length || after.some((frame) => frame.decision.acceptedIntents.some((intent) =>
    "targetActorId" in intent && intent.targetActorId === target))) failures.push("release_dead_purpose_still_commanded");
  const hits = nativeWeaponHits(context, alternative, 400).filter((fact) => fact.tick <= due);
  if (!squad || !hits.some((fact) => fact.kind === "native_damage" &&
    !!fact.damage.initiator?.actorId && squad.actorIds.includes(fact.damage.initiator.actorId)))
    failures.push("release_original_members_not_reassigned_to_native_effect_by_original_deadline");
  if (branch !== "cancelled") failures.push(...evaluateNativeAuthority("H-05", branch, context));
  if (branch === "uncertain") {
    const held = context.facts.find((fact) => fact.kind === "authority_delivery" &&
      fact.delivery.phase === "held" && fact.delivery.outcome);
    const command = held?.kind === "authority_delivery" ? held.delivery.outcome?.commandId : undefined;
    if (!command || !context.facts.some((fact) => fact.kind === "authority_delivery" &&
      fact.delivery.phase === "history_unavailable") || !context.frames.some((frame) => frame.tick > 400 && frame.tick <= 800 &&
      frame.decision.missionState?.authority.pendingCommandIds.includes(`command:${command}`)))
      failures.push("release_original_uncertain_work_was_not_retained_across_goal_loss");
  }
  if (branch === "paid") {
    const seeded = context.result.presetInitialQueueItems.filter((item) => item.kind === "production");
    const paid = nativePaidMissionOutputs(context);
    if (seeded.length !== 2 || seeded.some((item) => paid.filter((output) => output.item.itemId === item.itemId).length !== 1))
      failures.push("release_original_paid_queue_not_preserved_exactly_once");
  }
  return [...new Set(failures)];
}
