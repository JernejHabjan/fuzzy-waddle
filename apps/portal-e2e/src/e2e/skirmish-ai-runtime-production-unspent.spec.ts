import { expect, test } from "@playwright/test";
import { productionOperationFixture } from "./skirmish-ai-runtime-production-operation-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { reconcileRuntimeProductionUnspent } from "./skirmish-ai-runtime-production-unspent";

test("async publication retains the exact earlier selected input and cash ownership", () => {
  const capture = productionOperationFixture("immediate");
  const facts = capture.facts.map((fact) => ({ ...fact, tick: Math.max(5, fact.tick) }));
  const result = normalizeRuntimeProductionCausality({ ...capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.operations).toHaveLength(1);
  expect(result.operations[0]?.reservedUnspentBefore?.food).toBe(7);
  expect(result.operations[0]?.reservedUnspentAfter?.food).toBe(0);
});

test("publication before its consumed input remains invalid", () => {
  const capture = productionOperationFixture("immediate");
  const facts = capture.facts.map((fact) => (fact.kind === "decision_selected" ? { ...fact, tick: 3 } : fact));
  const result = normalizeRuntimeProductionCausality({ ...capture, facts });
  expect(result.failures).toContain("production_ai_committed_decision_lineage");
  expect(result.operations).toEqual([]);
  const boundary = facts.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "started");
  if (!boundary) throw new Error("synthetic_payment_start_missing");
  const original = normalizeRuntimeProductionCausality(capture);
  expect(
    reconcileRuntimeProductionUnspent({ ...capture, facts }, boundary, original.commands, original.payments).failures
  ).toContain("production_ai_operation_unspent_selection_invalid");
});
