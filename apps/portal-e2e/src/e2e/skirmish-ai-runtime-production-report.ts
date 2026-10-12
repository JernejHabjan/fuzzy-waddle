// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { projectRuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-projection";

/** One projection per final read; both legacy diagnostics and separate V2 authority retain their actual provenance. */
export function buildRuntimeProductionReport(
  productionCapture: AiRuntimeProductionCaptureV1,
  setup?: AiRuntimePresetApplicationV1
) {
  const productionCausality = normalizeRuntimeProductionCausality(productionCapture, setup);
  return {
    productionCapture,
    productionCausality,
    productionEvidenceV2: projectRuntimeProductionEvidenceV2(productionCapture, productionCausality, setup)
  };
}

import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { normalizeRuntimeProductionSetup } from "./skirmish-ai-runtime-production-setup";

/** Verifies the bridge from one marked runtime capture into the retained normalized diagnostic report. */
export function checkRuntimeProductionReportBridge(scenarioId: string, variant: RuntimeVariantResultV1): string[] {
  if (!["PRO-03", "PRO-06", "PRO-07"].includes(scenarioId)) return [];
  const capture = variant.productionCapture;
  const report = variant.productionCausality;
  if (!capture || !report) return [`runtime_production_report_missing:${scenarioId}:${variant.variantId}`];
  const selected = capture.facts.filter((fact) => fact.kind === "decision_selected");
  const failures: string[] = [];
  const v2 = variant.productionEvidenceV2;
  if (v2) {
    if (
      JSON.stringify(v2.coverage) !== JSON.stringify(capture.frontiers ?? null) ||
      v2.decisions.some(
        (entry) =>
          !selected.some(
            (fact) =>
              fact.sequence === entry.selectedSequence &&
              fact.tick === entry.selectedTick &&
              JSON.stringify(fact.decision) === JSON.stringify(entry.result)
          )
      )
    ) {
      failures.push(`runtime_production_v2_bridge_mismatch:${scenarioId}:${variant.variantId}`);
    }
    if (capture.setup) {
      try {
        const setup = normalizeRuntimeProductionSetup(capture.setup, variant.presetCreatedActorIds);
        if (JSON.stringify(v2.setup) !== JSON.stringify(setup))
          failures.push(`runtime_production_v2_setup_mismatch:${variant.variantId}`);
      } catch {
        failures.push(`runtime_production_v2_setup_unavailable:${variant.variantId}`);
      }
    } else failures.push(`runtime_production_v2_setup_unavailable:${variant.variantId}`);
  }
  if (selected.length === 0 || report.decisions.length !== selected.length) {
    failures.push(`runtime_production_decision_bridge_incomplete:${scenarioId}:${variant.variantId}`);
  } else if (
    selected.some((fact, index) => {
      if (fact.kind !== "decision_selected") return true;
      const decision = report.decisions[index];
      const identity = fact.decision.identity;
      return (
        !decision ||
        decision.selectedSequence !== fact.sequence ||
        decision.selectedTick !== fact.tick ||
        decision.identity.playerNumber !== identity.playerNumber ||
        decision.identity.tick !== identity.tick ||
        decision.identity.generation !== identity.generation ||
        decision.identity.decisionSequence !== identity.decisionSequence ||
        decision.identity.authorityEpoch !== identity.authorityEpoch
      );
    })
  ) {
    failures.push(`runtime_production_decision_bridge_identity_mismatch:${scenarioId}:${variant.variantId}`);
  }
  if (
    report.resourceServices.needAccounting.some((need) =>
      need.applications.some((application) => application.usefulContribution !== null)
    ) ||
    report.resourceServices.applicationIntervals.some(
      (interval) => interval.usefulContribution !== null || interval.continuousUsefulCapacity !== null
    )
  ) {
    failures.push(`runtime_production_partial_channel_activated:${scenarioId}:${variant.variantId}`);
  }
  return failures;
}
