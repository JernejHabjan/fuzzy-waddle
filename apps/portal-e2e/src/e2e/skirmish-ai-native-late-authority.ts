import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeRecoveryIncome } from "./skirmish-ai-native-recovery-evidence";
import { nativeProfileTransferFailures } from "./skirmish-ai-native-profile-transfer-evaluation";
import { nativeLateEpochReplayFailures } from "./skirmish-ai-native-late-epoch-evaluation";

/** A timeout is uncertainty, cancellation needs native acknowledgment, and a late receipt cannot resurrect settled work. */
export function evaluateNativeLateAuthority(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [];
  const deliveries = context.facts.flatMap((fact) => fact.kind === "authority_delivery" ? [fact] : []);
  const held = deliveries.filter((fact) => fact.delivery.phase === "held");
  const original = held.find((fact) => fact.delivery.outcome?.kind === "applied")?.delivery.outcome;
  if (!original?.effectId || original.authorityEpoch !== 0 || new Set(held.map((fact) => fact.delivery.outcome?.commandId)).size !== 1)
    return ["late_authority_original_applied_command_missing_or_ambiguous"];
  const commandId = original.commandId, brainCommandId = `command:${commandId}`;
  const releases = deliveries.filter((fact) => fact.delivery.phase === "released");
  if (!releases.length || deliveries.some((fact) => fact.delivery.faultId !== "original-ai-receipt") ||
      releases.some((fact) => fact.tick !== 1801 || !fact.delivery.outcome ||
        fact.delivery.outcome.commandId !== commandId || fact.delivery.outcome.authorityEpoch !== original.authorityEpoch ||
        fact.delivery.outcome.sequence !== original.sequence || fact.delivery.outcome.effectId !== original.effectId))
    failures.push("late_authority_original_receipt_release_missing_or_restamped");
  const raw = context.facts.filter((fact) => fact.kind === "outcome" && fact.outcome.commandId === commandId);
  if (raw.filter((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied").length !== 1)
    failures.push("late_authority_original_application_not_exactly_once");
  const during = context.frames.filter((frame) => frame.tick > original.tick && frame.tick <= 1800);
  if (!during.length || during.some((frame) => !frame.decision.missionState?.authority.pendingCommandIds.includes(brainCommandId)) ||
      !during.some((frame) => frame.tick >= original.tick + 900 && frame.decision.missionState?.authority.health === "technical_fault"))
    failures.push("late_authority_timeout_forged_settlement_or_reset_uncertainty");
  const after = context.frames.filter((frame) => frame.tick >= 1820);
  if (!after.length || after.some((frame) => frame.decision.missionState?.authority.pendingCommandIds.includes(brainCommandId)) ||
      !after.some((frame) => frame.decision.missionState?.pendingOutcomes.some((outcome) =>
        outcome.identity.commandId === brainCommandId && ["completed", "cancelled"].includes(outcome.kind))))
    failures.push("late_authority_original_terminal_not_reconciled_or_resurrected");
  const outputs = nativePaidMissionOutputs(context).filter((entry) => entry.item.commandId === commandId);
  if (branch === "cancellation_race") {
    const request = context.result.nativeCancellation;
    const cancellation = raw.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "cancelled");
    if (!request || request.tick !== 199 || request.originalCommandId !== commandId || !request.cancellationCommandId ||
        !cancellation || cancellation.tick < request.tick || !context.facts.some((fact) => fact.kind === "outcome" &&
          fact.outcome.commandId === request.cancellationCommandId && ["applied", "completed"].includes(fact.outcome.kind)))
      failures.push("late_authority_cancel_request_without_native_application");
    const refunds = context.facts.flatMap((fact) => fact.kind === "queue_resource" &&
      fact.resource.originatingCommandContext?.execution.commandId === commandId &&
      fact.resource.operation === "cancellation_refund" && fact.resource.emission.phase === "finished" ? [fact.resource] : []);
    const refund = refunds[0];
    if (outputs.length || refunds.length !== 1 || !refund?.storedPrice || refund.refundFactor === null ||
        refund.emission.phase !== "finished" || refund.emission.status !== "returned" ||
        refund.emission.callbackCount !== 1 || refund.emission.callbackLimitExceeded || refund.emission.nestedEmission ||
        refund.emission.snapshotRestoreInProgress || !refund.emission.balanceMatches || refund.gaps.length || !refund.emission.requested ||
        refund.actorId !== request?.producerId || refund.originatingCommandContext?.execution.effectId !== original.effectId ||
        refund.cancellationCommand?.execution?.commandId !== request?.cancellationCommandId ||
        Object.values(ResourceType).some((type) => (refund.emission.requested?.[type] ?? 0) !==
          Math.floor((refund.storedPrice?.[type] ?? 0) * (refund.payment === "immediate" ? 1 :
            (refund.totalTimeMs ?? 0) > 0 ? (refund.remainingTimeMs ?? 0) / Math.max(1, refund.totalTimeMs ?? 0) : 0) *
            (refund.refundFactor ?? 0))))
      failures.push("late_authority_cancel_created_output_or_refunded_incorrectly");
  } else if (outputs.length !== 1 || !raw.some((fact) => fact.kind === "outcome" && fact.outcome.kind === "completed"))
    failures.push("late_authority_original_paid_output_not_completed_once");
  if (branch.startsWith("host_")) {
    failures.push(...nativeProfileTransferFailures("Normal", context.result.nativeProfileTransfer));
    failures.push(...nativeLateEpochReplayFailures(branch === "host_command_then_receipt" ?
      "command_then_receipt" : "receipt_then_command", context.result.nativeProfileTransfer?.lateEpochReplay));
  }
  if (!nativeRecoveryIncome(context)) failures.push("late_authority_unrelated_native_income_stopped");
  return failures;
}
