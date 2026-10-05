import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { researchQueueMutationFixture } from "./skirmish-ai-runtime-research-queue-mutation-fixture";
import { expect, test } from "@playwright/test";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";

/** Pure invented contracts. Discovery is not execution or runtime coverage. */
test.describe("native production physical mutation projection", () => {
  test("enqueue transfers the admitted claim only at the actual push, with absolute all-lane obligations", () => {
    const result = normalizeRuntimeProductionCausality(productionQueueMutationFixture());
    expect(result.failures).toEqual([]);
    expect(result.queueMutations).toHaveLength(1);
    expect(result.queueMutations[0]).toMatchObject({ operation: "enqueue", commandId: "purchase", originatingCommandId: "purchase",
      itemIndex: 0, requestedTick: 4, scheduledTick: 6, tick: 6,
      resourcesBefore: { food: 100 }, resourcesAfter: { food: 100 },
      obligationsDue: { food: 11 }, obligationsAfter: { food: 32 },
      reservedUnspentBefore: { food: 7 }, reservedUnspentAfter: { food: 0 }, paymentOperationId: null });
    expect(result.gaps).not.toContain("production_ai_per_tick_enqueue_authority_missing");
    expect(result.gaps).toContain("production_ai_event_liabilities_missing");
  });

  test("immediate enqueue links its preceding actual charge without charging again", () => {
    const result = normalizeRuntimeProductionCausality(productionQueueMutationFixture("immediate"));
    expect(result.failures).toEqual([]);
    expect(result.queueMutations[0]).toMatchObject({ operation: "enqueue", paymentOperationId: 4,
      resourcesBefore: { food: 93 }, resourcesAfter: { food: 93 },
      obligationsDue: { food: 11 }, obligationsAfter: { food: 11 },
      reservedUnspentBefore: { food: 0 }, reservedUnspentAfter: { food: 0 } });
    expect(result.operations.filter((operation) => operation.kind === "immediate_charge")).toHaveLength(1);
    expect(result.gaps).toContain("unspent_payment_in_progress");
  });

  test("single-player application/mutation may finish before the real dispatch receipt", () => {
    const source = productionQueueMutationFixture("immediate");
    const receipt = source.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished");
    if (!receipt) throw new Error("synthetic_receipt_missing");
    const facts = [...source.facts.filter((fact) => fact !== receipt), receipt].map((fact, index): AiRuntimeProductionFactV1 => {
      const base = { ...fact, tick: 4, sequence: index + 1 };
      if (fact.kind === "outcome") return { ...base, kind: fact.kind, outcome: { ...fact.outcome, tick: 4 },
        scheduledTick: fact.outcome.kind === "dispatched" ? 4 : null };
      if (fact.kind === "command_delivered") return { ...base, kind: fact.kind, command: { ...fact.command, tick: 4 } };
      if (fact.kind === "intent_dispatch" && fact.event.kind === "finished" && fact.event.receipt.status === "dispatched") {
        return { ...base, kind: fact.kind, event: { ...fact.event, receipt: { status: "dispatched",
          command: { ...fact.event.receipt.command, tick: 4 } } } };
      }
      return base;
    });
    const result = normalizeRuntimeProductionCausality({ ...source, facts });
    expect(result.failures).toEqual([]);
    expect(result.queueMutations[0].sequence).toBeLessThan(result.commands[0].receiptSequence);
    expect(result.queueMutations[0]).toMatchObject({ requestedTick: 4, scheduledTick: 4, tick: 4, paymentOperationId: 4 });
  });

  test("production cancellation retains the early request, distinct applied command and removal before refund", () => {
    const result = normalizeRuntimeProductionCausality(productionQueueMutationFixture("cancel"));
    expect(result.failures).toEqual([]);
    const cancelled = result.queueMutations.find((mutation) => mutation.operation === "cancel_remove");
    expect(cancelled).toMatchObject({ commandId: "cancel", originatingCommandId: "purchase", item: { remainingTimeMs: 100 },
      requestedTick: 8, scheduledTick: 10, tick: 10, refundOperationId: 5,
      resourcesBefore: { food: 93 }, resourcesAfter: { food: 93 },
      obligationsDue: { food: 11 }, obligationsAfter: { food: 11 } });
    const refund = result.operations.find((operation) => operation.kind === "cancellation_refund");
    expect(refund?.boundarySequences[0]).toBeGreaterThan(cancelled?.sequence ?? Infinity);
    expect(refund?.resourcesAfter.food).toBe(100);
    expect(result.gaps).not.toContain("production_ai_mutation_cancel_terminal_missing");
  });

  test("research refunds while the exact item is still physical, before its cancellation removal", () => {
    const result = normalizeRuntimeProductionCausality(researchQueueMutationFixture());
    expect(result.failures).toEqual([]);
    const removed = result.queueMutations.find((mutation) => mutation.operation === "cancel_remove");
    expect(removed).toMatchObject({ commandId: "cancel", originatingCommandId: "purchase", refundOperationId: 5,
      resourcesBefore: { food: 97 }, resourcesAfter: { food: 97 }, item: { objectName: null } });
    const refund = result.operations.find((operation) => operation.kind === "cancellation_refund");
    expect(refund?.sequence).toBeLessThan(removed?.boundarySequences[0] ?? 0);
    expect(result.gaps).not.toContain("production_ai_mutation_cancel_terminal_missing");
  });

  test("completion removal retires its exact physical claim and keeps missing created-effect proof", () => {
    const result = normalizeRuntimeProductionCausality(productionQueueMutationFixture("completion"));
    expect(result.failures).toEqual([]);
    const completed = result.queueMutations.find((mutation) => mutation.operation === "complete_remove");
    expect(completed).toMatchObject({ item: { remainingTimeMs: 0 },
      obligationsDue: { food: 11 }, obligationsAfter: { food: 11 }, reservedUnspentAfter: { food: 0 } });
    expect(result.gaps).toContain("production_ai_mutation_created_effect_authority_missing");
    expect(result.gaps).not.toContain("production_ai_operation_queue_transfer_missing");
  });

  for (const defect of ["missing_after", "wrong_native", "cash", "other_lane", "liabilities", "position", "duplicate", "restore"]) {
    test(`contradictory ${defect} mutation suppresses all normalized money and physical intervals`, () => {
      const capture = productionQueueMutationFixture();
      const before = capture.facts.find((fact) => fact.kind === "queue_mutation" && fact.mutation.phase === "before");
      const after = capture.facts.find((fact) => fact.kind === "queue_mutation" && fact.mutation.phase === "after");
      if (!before || before.kind !== "queue_mutation" || !after || after.kind !== "queue_mutation" || !after.boundaryState) {
        throw new Error("synthetic_mutation_missing");
      }
      const changed = { ...after, mutation: { ...after.mutation }, boundaryState: { ...after.boundaryState } };
      if (defect === "cash" && changed.boundaryState.resources) changed.boundaryState.resources = {
        ...changed.boundaryState.resources, food: 99 };
      if (defect === "other_lane" && changed.boundaryState.queues) changed.boundaryState.queues =
        changed.boundaryState.queues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane, index) =>
          index === 1 ? { ...lane, items: [] } : lane) }));
      if (defect === "liabilities" && changed.boundaryState.obligations) changed.boundaryState.obligations = {
        ...changed.boundaryState.obligations, food: 0 };
      if (defect === "wrong_native") changed.mutation.originatingCommandContext = changed.mutation.originatingCommandContext ?
        { ...changed.mutation.originatingCommandContext, execution: { ...changed.mutation.originatingCommandContext.execution,
          effectId: "foreign" } } : null;
      if (defect === "position") changed.mutation.itemIndex = 1;
      if (defect === "restore") changed.mutation.snapshotRestoreInProgress = true;
      let facts = capture.facts.flatMap((fact) => fact === after ? defect === "missing_after" ? [] : [changed] : [fact]);
      if (defect === "duplicate") facts = [...facts, { ...before, tick: 11 }, { ...after, tick: 11 }];
      const result = normalizeRuntimeProductionCausality({ ...capture,
        facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.queueMutations).toEqual([]);
      expect(result.operations).toEqual([]);
      expect(result.payments).toEqual([]);
    });
  }

  test("absent physical state stays a named gap without borrowing queue_changed or a later snapshot", () => {
    const capture = productionQueueMutationFixture();
    const result = normalizeRuntimeProductionCausality({ ...capture, facts: capture.facts.map((fact) =>
      fact.kind === "queue_mutation" ? { ...fact, boundaryState: undefined } : fact) });
    expect(result.failures).toEqual([]);
    expect(result.queueMutations).toEqual([]);
    expect(result.gaps).toContain("production_ai_mutation_boundary_missing");
    expect(result.gaps).toContain("production_ai_per_tick_enqueue_authority_missing");
  });

  test("completion cannot borrow a zero head without its genuine preceding advanced callback", () => {
    const source = productionQueueMutationFixture("completion");
    const result = normalizeRuntimeProductionCausality({ ...source, facts: source.facts.filter((fact) =>
      fact.kind !== "queue_progress" || fact.progress.phase !== "advanced") });
    expect(result.failures).toContain("production_ai_mutation_completion_progress_missing");
    expect(result.queueMutations).toEqual([]);
  });
});
