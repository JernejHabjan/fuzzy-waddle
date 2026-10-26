import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeAuthoredWorkerRecoveryIncome } from "./skirmish-ai-native-recovery-evidence";

/** A settled receipt may be applied between decision samples; verify it is held, released and drained by identity. */
export function nativeFaultReceiptReconciled(context: ReturnType<typeof nativeScenarioContext>): boolean {
  const held = context.facts.filter((fact) => fact.kind === "authority_delivery" && fact.delivery.phase === "held" &&
    fact.delivery.outcome);
  return held.some((original) => {
    if (original.kind !== "authority_delivery" || !original.delivery.outcome) return false;
    const commandId = original.delivery.outcome.commandId;
    const terminal = context.facts.find((fact) => fact.kind === "outcome" && fact.outcome.commandId === commandId &&
      ["completed", "failed", "cancelled", "rejected"].includes(fact.outcome.kind) &&
      fact.outcome.sequence === original.delivery.outcome?.sequence &&
      fact.outcome.authorityEpoch === original.delivery.outcome?.authorityEpoch);
    if (!terminal || terminal.kind !== "outcome") return false;
    const release = context.facts.find((fact) => fact.kind === "authority_delivery" && fact.delivery.phase === "released" &&
      fact.delivery.outcome?.commandId === commandId && fact.delivery.outcome.kind === terminal.outcome.kind &&
      fact.delivery.outcome.sequence === terminal.outcome.sequence &&
      fact.delivery.outcome.authorityEpoch === terminal.outcome.authorityEpoch);
    if (!release || release.kind !== "authority_delivery") return false;
    const pendingId = `command:${commandId}` as `command:${string}`;
    const stayedPending = context.frames.some((frame) => frame.tick > original.delivery.tick &&
      frame.tick < release.delivery.tick && frame.decision.missionState?.authority.pendingCommandIds.includes(pendingId));
    const drained = context.frames.some((frame) => frame.tick > release.delivery.tick &&
      frame.decision.missionState?.authority.health === "healthy" &&
      !frame.decision.missionState.authority.pendingCommandIds.includes(pendingId));
    return stayedPending && drained;
  });
}

/** Fault annotations prove injection only. Real work, original receipt ownership and committed retry history prove isolation. */
export function evaluateNativeFault(branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const { frames, facts } = context;
  const injections = facts.filter((fact) => fact.kind === "brain_fault");
  const failures: string[] = [];
  if (!injections.length || injections.some((fact) => fact.kind !== "brain_fault" || fact.fault.kind !== branch ||
      fact.playerNumber !== 2 || fact.tick < 200 || fact.tick > 800)) failures.push("fault_real_boundary_injection_missing");
  if (!frames.some((frame) => frame.tick < 200 && frame.decision.acceptedIntents.length))
    failures.push("fault_preexisting_native_orders_missing");
  if (!nativeAuthoredWorkerRecoveryIncome(context, 200)) failures.push("fault_native_gathering_did_not_continue");
  if (!nativeFaultReceiptReconciled(context))
    failures.push("fault_mandatory_original_reconciliation_missing");
  if (frames.some((frame) => frame.decision.acceptedIntents.some((intent) => !Number.isFinite(intent.utility) ||
      intent.claims.some((claim) => claim.kind === "resource" && (!Number.isFinite(claim.amount) || claim.amount < 0)))))
    failures.push("fault_invalid_output_published");
  if (branch === "mandatory") {
    if (!context.result.aiErrors.some((error) => error.includes("ai_runtime_mandatory_fault")) ||
        !frames.some((frame) => frame.tick > 800 && frame.decision.missionState?.authority.health === "technical_fault"))
      failures.push("fault_mandatory_corruption_was_swallowed");
  } else {
    if (frames.some((frame) => frame.decision.missionState?.authority.health === "technical_fault"))
      failures.push("fault_optional_output_poisoned_mandatory_authority");
    const owner = branch === "debug" ? "debug_projection" : injections.find((fact) => fact.kind === "brain_fault")?.fault.owner;
    const incidents = frames.flatMap((frame) => frame.decision.missionState?.scheduler.boundaryFaults ?? [])
      .filter((incident) => incident.owner === owner);
    if (!incidents.length || !incidents.some((incident) => incident.recoveredTick !== null && incident.recoveredTick > 800))
      failures.push("fault_saved_incident_or_real_recovery_missing");
    const cadence = frames[0]?.decision.input?.cadence.configuredIntervalTicks ?? 0;
    for (let index = 1; index < injections.length; index++) {
      const before = injections[index - 1], after = injections[index];
      const incident = incidents.find((entry) => entry.lastFailureTick === before?.tick);
      if (!before || !after || !cadence || !incident || after.tick < incident.retryAtTick)
        failures.push("fault_retry_cooldown_bypassed");
    }
  }
  if (!frames.some((frame) => frame.tick > 800 && frame.decision.acceptedIntents.length))
    failures.push("fault_native_planning_did_not_resume");
  return [...new Set(failures)];
}

/** Only the explicitly injected mandatory marker is expected. All other runtime errors retain the ordinary failure path. */
export function isExpectedNativeMandatoryError(error: string, result: ReturnType<typeof nativeScenarioContext>["result"]): boolean {
  return error.includes("ai_runtime_mandatory_fault") && !!result.productionCapture?.facts.some((fact) => fact.kind === "brain_fault" &&
    fact.fault.kind === "mandatory" && fact.tick >= 200 && fact.tick <= 800);
}
