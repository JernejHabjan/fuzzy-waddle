import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
import { evaluateRuntimeProductionTransition } from "./skirmish-ai-runtime-production-transition-evaluation";
import { evaluateRuntimeProducerResilience } from "./skirmish-ai-runtime-producer-resilience-evaluation";
import { evaluateRuntimeProductionPayments, evaluateRuntimeProductionRefund }
  from "./skirmish-ai-runtime-production-refund-evaluation";
import { validateRuntimeProductionEvidence } from "./skirmish-ai-runtime-production-evidence-validation";

/** Mandatory on PRO-03/06/07: old aggregate capacity/queue assertions are not causal proof. */
export function evaluateRuntimeProductionContract(
  scenarioId: string,
  contract: RuntimeProductionContractV1 | undefined,
  evidence: RuntimeProductionEvidenceV1 | undefined
): string[] {
  if (!["PRO-03", "PRO-06", "PRO-07"].includes(scenarioId)) return [];
  if (!contract || contract.scenarioId !== scenarioId) return ["production_contract_missing"];
  if (!evidence || !evidence.pairedSetupDigest || !evidence.snapshots.length) return ["production_evidence_missing"];
  const { snapshots, events } = evidence;
  const first = snapshots[0];
  const final = snapshots.at(-1);
  if (!first || !final) return ["production_evidence_missing"];
  if (!Number.isSafeInteger(contract.latestTick) || !Number.isSafeInteger(contract.stableForTicks) ||
    contract.stableForTicks <= 0 || contract.latestTick <= contract.stableForTicks ||
    first.tick !== 0 || final.tick !== contract.latestTick ||
    snapshots.some((snapshot, index) => !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
      (index > 0 && snapshot.tick <= (snapshots[index - 1]?.tick ?? Infinity))) ||
    events.some((event, index) => !Number.isSafeInteger(event.tick) || event.tick < 0 || event.tick > contract.latestTick ||
      !Number.isSafeInteger(event.sequence) || event.sequence < 0 || !event.commandId || !event.effectId ||
      (index > 0 && (event.sequence <= (events[index - 1]?.sequence ?? Infinity) ||
        event.tick < (events[index - 1]?.tick ?? Infinity))))) {
    return ["production_evidence_horizon_or_order"];
  }
  const applied = events.filter((event) => ["construct", "enqueue", "cancel"].includes(event.kind));
  if (new Set(applied.map((event) => event.effectId)).size !== applied.length) return ["production_duplicate_applied_effect"];
  if (!contract.pairId || !contract.producerObjectName || !contract.productKey) return ["production_contract_identity"];
  const shape = validateRuntimeProductionEvidence(contract, evidence);
  const payments = evaluateRuntimeProductionPayments(evidence);
  const semantic = scenarioId === "PRO-03" ? evaluateRuntimeProductionTransition(contract, evidence)
    : scenarioId === "PRO-06" ? evaluateRuntimeProducerResilience(contract, evidence)
    : evaluateRuntimeProductionRefund(contract, evidence);
  return [...new Set([...shape, ...payments, ...semantic])];
}
