import { expect, test } from "@playwright/test";
import { evaluateRuntimeProductionContract } from "./skirmish-ai-runtime-production-contract-evaluation";
import { productionContract, productionEvidence, productionEvent, productionSnapshot }
  from "./skirmish-ai-runtime-production-contract-fixtures";
import { isEvidenceStopSafe } from "./skirmish-ai-runtime-evidence-stop";
import { validateRuntimeProductionEvidence } from "./skirmish-ai-runtime-production-evidence-validation";

const contract = productionContract("PRO-07", "shared_contention");
const evidence = productionEvidence([productionSnapshot(0), productionSnapshot(600)], []);

test("causal production evidence requires tick zero, full horizon and strict same-tick application order", () => {
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, snapshots: evidence.snapshots.slice(1) }))
    .toEqual(["production_evidence_horizon_or_order"]);
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, snapshots: evidence.snapshots.slice(0, 1) }))
    .toEqual(["production_evidence_horizon_or_order"]);
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence,
    events: [productionEvent(2, 100, "enqueue"), productionEvent(1, 100, "enqueue")] }))
    .toEqual(["production_evidence_horizon_or_order"]);
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence,
    events: [productionEvent(1, 100, "enqueue"), productionEvent(2, 100, "enqueue", { effectId: "effect:1" })] }))
    .toEqual(["production_duplicate_applied_effect"]);
});

test("causal production evidence rejects fabricated initial/created identities and non-finite prices", () => {
  expect(validateRuntimeProductionEvidence(contract, { ...evidence, initialProducerIds: ["unrelated"] }))
    .toContain("production_initial_identity_mismatch");
  expect(validateRuntimeProductionEvidence(contract, { ...evidence,
    events: [productionEvent(1, 100, "complete", { createdActorId: "same-unit" }),
      productionEvent(2, 200, "complete", { createdActorId: "same-unit" })] })).toContain("production_duplicate_created_identity");
  expect(validateRuntimeProductionEvidence(contract, { ...evidence, catalog: evidence.catalog.map((entry) =>
    ({ ...entry, cost: { wood: Number.NaN } })) })).toContain("production_catalog_numeric_evidence");
});

test("causal production oracles cannot opt into early evidence stop", () => {
  for (const scenarioId of ["PRO-03", "PRO-06", "PRO-07"] as const) {
    expect(isEvidenceStopSafe({ minimumDecisions: 1, minimumAppliedCommands: 1, requiredAiFactions: ["Tivara"],
      requiredProductionContracts: { subject: { ...contract, scenarioId } } })).toBe(false);
  }
});
