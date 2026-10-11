import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

/** Verifies the bridge from one marked runtime capture into the retained normalized diagnostic report. */
export function checkRuntimeProductionReportBridge(
  scenarioId: string,
  variant: RuntimeVariantResultV1
): string[] {
  if (!["PRO-03", "PRO-06", "PRO-07"].includes(scenarioId)) return [];
  const capture = variant.productionCapture;
  const report = variant.productionCausality;
  if (!capture || !report) return [`runtime_production_report_missing:${scenarioId}:${variant.variantId}`];
  const selected = capture.facts.filter((fact) => fact.kind === "decision_selected");
  const failures: string[] = [];
  if (selected.length === 0 || report.decisions.length !== selected.length) {
    failures.push(`runtime_production_decision_bridge_incomplete:${scenarioId}:${variant.variantId}`);
  } else if (selected.some((fact, index) => {
    if (fact.kind !== "decision_selected") return true;
    const decision = report.decisions[index];
    const identity = fact.decision.identity;
    return !decision || decision.selectedSequence !== fact.sequence || decision.selectedTick !== fact.tick ||
      decision.identity.playerNumber !== identity.playerNumber || decision.identity.tick !== identity.tick ||
      decision.identity.generation !== identity.generation ||
      decision.identity.decisionSequence !== identity.decisionSequence ||
      decision.identity.authorityEpoch !== identity.authorityEpoch;
  })) {
    failures.push(`runtime_production_decision_bridge_identity_mismatch:${scenarioId}:${variant.variantId}`);
  }
  if (report.resourceServices.needAccounting.some((need) =>
    need.applications.some((application) => application.usefulContribution !== null)) ||
    report.resourceServices.applicationIntervals.some((interval) => interval.usefulContribution !== null ||
      interval.continuousUsefulCapacity !== null)) {
    failures.push(`runtime_production_partial_channel_activated:${scenarioId}:${variant.variantId}`);
  }
  return failures;
}
