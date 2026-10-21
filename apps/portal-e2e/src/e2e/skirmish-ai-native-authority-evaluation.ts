import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeRecoveryIncome } from "./skirmish-ai-native-recovery-evidence";

/** Consumer delays are joined to independent shared application and physical output, never accepted as application proof. */
export function evaluateNativeAuthority(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  if (context.frames.some((frame) => !frame.decision.missionState?.authority || !frame.decision.missionState.pendingOutcomes))
    return ["authority_actual_selected_pending_ownership_missing"];
  const failures: string[] = [];
  const deliveries = context.facts.flatMap((fact) => fact.kind === "authority_delivery" ? [{ fact, value: fact.delivery }] : []);
  if (!deliveries.length || deliveries.some(({ fact, value }) => value.tick !== fact.tick || value.playerNumber !== 2 ||
      value.faultId !== "original-ai-receipt" || value.pendingCount < 0 || value.pendingCount > 128))
    failures.push("authority_native_consumer_fault_boundary_missing_or_invalid");
  const held = deliveries.filter(({ value }) => value.phase === "held" && value.outcome);
  const commands = [...new Set(held.flatMap(({ value }) => value.outcome ? [value.outcome.commandId] : []))];
  if (!commands.length) failures.push("authority_no_original_ai_receipt_actually_held");
  const paid = nativePaidMissionOutputs(context);
  for (const commandId of commands) {
    const original = held.find(({ value }) => value.outcome?.commandId === commandId)?.value.outcome;
    const releases = deliveries.filter(({ value }) => value.phase === "released" && value.outcome?.commandId === commandId);
    const released = releases[0];
    if (!original || !released || releases.some(({ value }) => value.outcome?.sequence !== original.sequence ||
        value.outcome?.authorityEpoch !== original.authorityEpoch || value.outcome?.effectId !== original.effectId)) {
      failures.push("authority_original_receipt_identity_not_retained_through_release");
      continue;
    }
    const raw = context.facts.filter((fact) => fact.kind === "outcome" && fact.outcome.commandId === commandId);
    const terminal = raw.find((fact) => fact.kind === "outcome" &&
      ["completed", "rejected", "failed", "cancelled"].includes(fact.outcome.kind));
    const delayedHistory = id === "H-05" && branch === "uncertain";
    const reconciled = context.frames.find((frame) =>
      (delayedHistory ? frame.tick >= released.fact.tick && frame.tick <= released.fact.tick + 40 : frame.tick < released.fact.tick) &&
      frame.decision.missionState?.pendingOutcomes.some((outcome) => outcome.identity.commandId === `command:${commandId}` &&
        ["completed", "rejected", "failed", "cancelled"].includes(outcome.kind)));
    const charges = context.facts.filter((fact) => fact.kind === "queue_resource" &&
      fact.resource.originatingCommandContext?.execution.effectId === original.effectId &&
      fact.resource.ownerNumber === 2 &&
      fact.resource.operation === "immediate_charge" && fact.resource.emission.phase === "finished" &&
      fact.resource.emission.status === "returned");
    if (charges.length > 1) failures.push("authority_original_effect_charged_more_than_once");
    const requested = context.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "requested" &&
      fact.event.correlation.effectId === original.effectId);
    if (requested?.kind === "intent_dispatch" && requested.event.kind === "requested") {
      const demandId = requested.event.acceptedIntent?.demandId;
      if (demandId && context.facts.some((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "requested" &&
        fact.sequence > requested.sequence && fact.tick < (reconciled?.tick ?? released.fact.tick) &&
        fact.event.acceptedIntent?.demandId === demandId && fact.event.correlation.effectId !== original.effectId))
        failures.push("authority_uncertain_original_demand_retried_with_new_effect_identity");
    }
    if (id !== "H-10" && (!terminal || !reconciled))
      failures.push("authority_missing_original_native_terminal_or_independent_reconciliation");
    if (id !== "H-10" && !(id === "H-06" && branch === "rejected") &&
        (charges.length !== 1 || paid.filter((entry) => entry.item.commandId === commandId).length !== 1))
      failures.push("authority_original_paid_output_not_created_exactly_once");
    if (id === "H-06" && branch === "rejected" && (charges.length ||
        !raw.some((fact) => fact.kind === "outcome" && ["failed", "rejected"].includes(fact.outcome.kind)) ||
        !deliveries.some(({ value }) => value.phase === "queue_contended")))
      failures.push("authority_rejected_control_not_native_unspent_nonapplication");
    const firstAfterRelease = context.frames.find((frame) => frame.tick > released.fact.tick);
    if (terminal && firstAfterRelease?.decision.missionState?.authority.pendingCommandIds.includes(`command:${commandId}`))
      failures.push("authority_late_original_receipt_resurrected_settled_work");
    if (id === "H-07" && branch === "destroyed") {
      const output = paid.find((entry) => entry.item.commandId === commandId);
      const loss = deliveries.find(({ value }) => value.phase === "output_destroyed" && value.outcome?.commandId === commandId &&
        value.actorId === output?.actor.actorId);
      const damage = context.facts.find((fact) => fact.kind === "native_damage" &&
        fact.damage.target.actorId === output?.actor.actorId && (fact.damage.healthAfter ?? Infinity) <= 0);
      if (!output || !loss || !damage || !reconciled || damage.tick >= reconciled.tick ||
          context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) =>
            identity.actorId === output.actor.actorId && identity.alive))
        failures.push("authority_missing_output_was_not_destroyed_before_original_history_reconciliation");
    }
    if (id === "H-07" && branch === "alive" && !context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) =>
      identity.actorId === paid.find((entry) => entry.item.commandId === commandId)?.actor.actorId && identity.alive))
      failures.push("authority_living_output_control_not_alive_at_horizon");
  }
  if (id === "H-10") failures.push(...backlogFailures(branch, context, commands));
  if (!nativeRecoveryIncome(context)) failures.push("authority_unrelated_native_income_did_not_continue");
  return [...new Set(failures)];
}

/** The actual configured threshold governs admission; unresolved identities survive until real receipts resume. */
function backlogFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>, commands: readonly string[]) {
  const failures: string[] = [], limit = context.frames[0]?.decision.missionState?.authority.pendingLimit;
  if (!limit || limit !== 128) return ["authority_configured_native_backlog_premise_missing"];
  const target = branch === "below_capacity" ? limit - 1 : limit;
  const releaseTick = branch === "resumed" ? 1201 : 1801;
  const peak = context.frames.find((frame) => frame.decision.missionState?.authority.pendingCommandIds.length === target);
  if (commands.length !== target || !peak) failures.push("authority_native_capacity_boundary_not_actually_reached");
  const during = context.frames.filter((frame) => frame.tick >= (peak?.tick ?? Infinity) && frame.tick < releaseTick);
  const heldAtPeak = peak?.decision.missionState?.authority.pendingCommandIds ?? [];
  if (during.some((frame) => heldAtPeak.some((id) => !frame.decision.missionState?.authority.pendingCommandIds.includes(id))))
    failures.push("authority_unresolved_identity_evicted_before_receipt_or_history_return");
  if (branch === "over_capacity" && !during.some((frame) => frame.decision.decisions.some((decision) =>
      decision.outcome === "rejected" && decision.detail === "authority_backpressure")))
    failures.push("authority_full_backlog_did_not_backpressure_new_admission");
  if (!context.facts.some((fact) => fact.kind === "authority_delivery" && fact.delivery.phase === "history_unavailable"))
    failures.push("authority_checkpoint_unavailability_control_not_exercised");
  const after = context.frames.find((frame) => frame.tick > releaseTick && heldAtPeak.every((id) =>
    !frame.decision.missionState?.authority.pendingCommandIds.includes(id)));
  if (!after || !nativeRecoveryIncome(context, releaseTick)) failures.push("authority_backlog_did_not_drain_and_resume_native_work");
  if (during.some((frame) => frame.decision.acceptedIntents.some((intent) => intent.kind === "concede")))
    failures.push("authority_transport_failure_caused_strategic_concession");
  return failures;
}
