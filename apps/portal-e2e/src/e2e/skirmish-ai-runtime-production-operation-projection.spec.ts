import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionRefundOperationFixture } from "./skirmish-ai-runtime-production-refund-operation-fixture";
import { productionOperationFixture } from "./skirmish-ai-runtime-production-operation-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";
import { evaluateRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-evaluation";

test.describe("production operation synthetic contract tests", () => {
  test("pairs successful charges with actual-shaped advanced boundaries, including final and initially zero heads", () => {
    for (const remaining of [100, 50, 0]) {
      const result = normalizeRuntimeProductionCausality(productionOperationFixture("tick", remaining));
      expect(result.failures).toEqual([]);
      expect(result.operations).toHaveLength(1);
      const operation = result.operations[0];
      expect(operation.kind).toBe("tick_charge");
      expect(operation.remainingSuccessfulTicks).toBe(Math.max(1, Math.ceil(remaining / 50)));
      expect(operation.resourcesBefore.food).toBe(100);
      expect(operation.resourcesAfter.food).toBe(93);
      expect(operation.obligationsDue.food - operation.obligationsAfter.food).toBe(7);
      expect(operation.reservedUnspentBefore?.food).toBe(0);
      expect(operation.reservedUnspentAfter?.food).toBe(0);
      expect(operation.attemptId).toBe(1);
      expect(operation.laneId).toBe("producer:lane:0");
      expect(result.payments).toEqual([]);
      expect(result.gaps).not.toContain("production_ai_per_tick_liability_missing");
      expect(result.gaps).toContain("production_ai_per_tick_enqueue_authority_missing");
    }
  });

  test("retains genuine denied attempts with no charge or guessed progress", () => {
    const result = normalizeRuntimeProductionCausality(productionOperationFixture("denied"));
    expect(result.failures).toEqual([]);
    expect(result.operations).toHaveLength(1);
    const operation = result.operations[0];
    expect(operation.kind).toBe("tick_denied");
    expect(operation.resourcesAfter).toEqual(operation.resourcesBefore);
    expect(operation.obligationsAfter).toEqual(operation.obligationsDue);
    expect(operation.charged.food).toBe(0);
    expect(operation.refundAmounts.food).toBe(0);
  });

  test("settles immediate claims once while retaining pending amounts and the original transient raw gap", () => {
    const raw = productionOperationFixture("immediate");
    const result = normalizeRuntimeProductionCausality(raw);
    expect(result.failures).toEqual([]);
    expect(result.operations).toHaveLength(1);
    const operation = result.operations[0];
    expect(operation.kind).toBe("immediate_charge");
    expect(operation.reservedUnspentBefore?.food).toBe(7);
    expect(operation.reservedUnspentAfter?.food).toBe(0);
    expect(operation.obligationsDue.food).toBe(11);
    expect(operation.obligationsAfter.food).toBe(11);
    expect(operation.charged.food).toBe(7);
    expect(operation.reconciledCallbackSequences).toHaveLength(1);
    const callback = raw.facts.find((fact) => fact.sequence === operation.reconciledCallbackSequences[0]);
    expect(callback?.boundaryState?.unspentClaims?.resources).toBeNull();
    expect(callback?.boundaryState?.pendingResourceClaims?.food).toBe(7);
    expect(result.gaps).toContain("unspent_payment_in_progress");
    expect(result.gaps).toContain("production_boundary_unspent_reconciliation_missing");
    expect(evaluateRuntimeProductionCausality("PRO-07", result))
      .toContain("production_capture_gap:production_ai_event_liabilities_missing");
    expect(result).not.toHaveProperty("productionEvidence");
    const start = raw.facts.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "started");
    expect(operation.resourcesBefore).not.toBe(start?.boundaryState?.resources);
  });

  test("a stale intermediate callback cannot claim scoped gap reconciliation from settled endpoints", () => {
    const raw = productionOperationFixture("immediate");
    const facts = raw.facts.map((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "callback" &&
      fact.boundaryState?.resources ? { ...fact, boundaryState: { ...fact.boundaryState,
        resources: { ...fact.boundaryState.resources, food: 100 } } } : fact);
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.operations[0].reconciledCallbackSequences).toEqual([]);
    expect(result.gaps).toContain("unspent_payment_in_progress");
  });

  test("a distinct actual-shaped cancellation refunds the purchased item without converting its credit into a charge", () => {
    const result = normalizeRuntimeProductionCausality(productionRefundOperationFixture());
    expect(result.failures).toEqual([]);
    expect(result.operations).toHaveLength(2);
    const refund = result.operations[1];
    expect(refund.kind).toBe("cancellation_refund");
    expect(refund.commandId).toBe("cancel");
    expect(refund.originatingCommandId).toBe("purchase");
    expect(refund.itemId).toBe("queue:producer:purchase");
    expect(refund.resourcesBefore.food).toBe(93);
    expect(refund.resourcesAfter.food).toBe(97);
    expect(refund.refundAmounts.food).toBe(4);
    expect(refund.charged.food).toBe(0);
    expect(refund.obligationsAfter).toEqual(refund.obligationsDue);
    expect(refund.reservedUnspentBefore?.food).toBe(0);
    expect(refund.reconciledCallbackSequences).toEqual([]);
  });

  test("absent unspent authority remains null rather than borrowing pending claims or saved leases", () => {
    const raw = productionOperationFixture();
    const facts = raw.facts.map((fact) => ({ ...fact, boundaryState: fact.boundaryState ? {
      ...fact.boundaryState, unspentClaims: undefined
    } : undefined }));
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toEqual([]);
    expect(result.operations[0].reservedUnspentBefore).toBeNull();
    expect(result.operations[0].reservedUnspentAfter).toBeNull();
    expect(result.gaps).toContain("production_ai_operation_unspent_missing");
  });

  test("invalid whole-ledger totals, missing admissions, premature paid state and foreign claims suppress operations", () => {
    for (const mutation of ["total", "omitted", "paid", "identity", "lease", "cash", "lane", "effect"] as const) {
      const raw = productionOperationFixture("immediate");
      const facts = raw.facts.map((fact): AiRuntimeProductionFactV1 => {
        if (mutation === "effect" && fact.kind === "queue_resource") return { ...fact, resource: { ...fact.resource,
          originatingCommandContext: fact.resource.originatingCommandContext ? { ...fact.resource.originatingCommandContext,
            execution: { ...fact.resource.originatingCommandContext.execution, effectId: "foreign" } } : null } };
        if (mutation === "lease" && fact.kind === "decision_selected") return { ...fact, decision: { ...fact.decision,
          reservations: fact.decision.reservations.map((lease) => ({ ...lease, subjectKey: "resource:wood" })) } };
        const state = fact.boundaryState;
        if (!state) return fact;
        if (mutation === "cash") return { ...fact, boundaryState: { ...state, resources: state.resources ?
          { ...state.resources, minerals: Number.NaN } : null } };
        if (mutation === "lane") return { ...fact, boundaryState: { ...state, queues: state.queues?.map((queue) =>
          ({ ...queue, lanes: [...queue.lanes, queue.lanes[0]] })) ?? null } };
        const ledger = state.unspentClaims;
        if (!ledger?.resources) return fact;
        return { ...fact, boundaryState: { ...state, unspentClaims: { ...ledger,
          resources: mutation === "total" ? { ...ledger.resources, food: 999 } : ledger.resources,
          entries: mutation === "omitted" ? [] : ledger.entries.map((entry) => ({ ...entry,
            state: mutation === "paid" ? "paid" : entry.state,
            identity: mutation === "identity" ? { ...entry.identity, authorityEpoch: 99 } : entry.identity
          })) } } };
      });
      const result = normalizeRuntimeProductionCausality({ ...raw, facts });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.operations).toEqual([]);
    }
  });

  test("payment finish alone cannot substitute for post-progress, and null callbacks are never closest-snapshot filled", () => {
    for (const missing of ["advanced", "boundary"] as const) {
      const raw = productionOperationFixture();
      const facts = raw.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
        if (fact.kind !== "queue_progress" || fact.progress.phase !== "advanced") return [fact];
        return missing === "advanced" ? [] : [{ ...fact, boundaryState: undefined }];
      });
      const result = normalizeRuntimeProductionCausality({ ...raw, facts });
      expect(result.operations).toEqual([]);
      expect(result.gaps).toContain("production_ai_per_tick_liability_missing");
    }
  });

  test("rejects duplicate queue owners/lanes and reused operation identities", () => {
    const raw = productionOperationFixture();
    const head = raw.facts.find((fact) => fact.kind === "queue_progress");
    if (!head?.boundaryState?.queues) throw new Error("synthetic_queue_missing");
    const queues = head.boundaryState.queues;
    expect(calculateRuntimeQueueLiabilities([...queues, queues[0]])).toBeNull();
    const duplicate = raw.facts.filter((fact) => fact.kind === "queue_progress" || fact.kind === "queue_resource");
    const facts = [...raw.facts, ...duplicate.map((fact): AiRuntimeProductionFactV1 => fact.kind === "queue_progress"
      ? { ...fact, progress: { ...fact.progress, attemptId: 2 } } : fact)].map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toContain("production_ai_progress_payment_operation_reused");
    expect(result.operations).toEqual([]);
  });
});
