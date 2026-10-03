import { expect, test } from "@playwright/test";
import { productionCausalityFixture } from "./skirmish-ai-runtime-production-causality-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { multiplayerSharedQueueFixture } from "./skirmish-ai-multiplayer-shared-queue-fixture";
import { evaluateRuntimeProductionContract } from "./skirmish-ai-runtime-production-contract-evaluation";
import { productionContract } from "./skirmish-ai-runtime-production-contract-fixtures";
import { evaluateRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-evaluation";

test.describe("production AI causal synthetic contract tests", () => {
  for (const branch of ["shared_contention", "cancel_research"] as const) {
    test(`links actual-shaped AI scopes and item payments: ${branch}`, () => {
      const raw = productionCausalityFixture(branch);
      const result = normalizeRuntimeProductionCausality(raw);
      expect(result.failures).toEqual([]);
      expect(result.commands).toHaveLength(branch === "shared_contention" ? 2 : 4);
      expect(result.payments).toHaveLength(branch === "shared_contention" ? 2 : 3);
      expect(result.commands.every((entry) => entry.acceptedIntent.planId === "plan:force")).toBe(true);
      expect(result.commands.every((entry) => entry.requestedTick < entry.command.tick)).toBe(true);
      expect(result.gaps).toEqual(expect.arrayContaining(raw.gaps));
      expect(result.gaps).toContain("production_ai_event_liabilities_missing");
      expect(result).not.toHaveProperty("productionEvidence");
      expect(evaluateRuntimeProductionContract("PRO-07", productionContract("PRO-07", "shared_contention"), undefined))
        .toContain("production_evidence_missing");
      const receipt = raw.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished");
      if (!receipt || receipt.kind !== "intent_dispatch" || receipt.event.kind !== "finished" ||
        receipt.event.receipt.status !== "dispatched") throw new Error("synthetic_receipt_missing");
      expect(result.commands[0].command).not.toBe(receipt.event.receipt.command);
    });
  }

  test("human facts cannot provide accepted AI intent or be promoted into AI money", () => {
    const raw = multiplayerSharedQueueFixture("shared_contention").capture;
    if (!raw) throw new Error("synthetic_raw_missing");
    const result = normalizeRuntimeProductionCausality(raw);
    expect(result.commands).toEqual([]);
    expect(result.payments).toEqual([]);
    expect(result.gaps).toEqual(expect.arrayContaining(raw.gaps));
  });

  test("missing accepted intent, changed request payload and forged stamp fail closed", () => {
    for (const mutation of ["intent", "payload", "stamp"] as const) {
      const raw = productionCausalityFixture();
      const facts = raw.facts.map((fact) => {
        if (mutation === "stamp" && fact.kind === "outcome") return {
          ...fact, outcome: { ...fact.outcome, authorityEpoch: 99 }
        };
        if (fact.kind !== "intent_dispatch" || fact.event.kind !== "requested") return fact;
        if (mutation === "intent") return { ...fact, event: { ...fact.event, acceptedIntent: undefined } };
        if (mutation === "payload" && fact.event.command.type === "PRODUCTION") return {
          ...fact, event: { ...fact.event, command: { ...fact.event.command, actorIds: ["other-producer"] } }
        };
        return fact;
      });
      const result = normalizeRuntimeProductionCausality({ ...raw, facts });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.commands.some((entry) => entry.command.type === "PRODUCTION")).toBe(false);
      expect(result.payments.some((payment) => payment.resource.objectName !== null)).toBe(false);
    }
  });

  test("duplicate delivery, callback substitution and capture loss cannot prove a causal chain", () => {
    const raw = productionCausalityFixture();
    const delivered = raw.facts.find((fact) => fact.kind === "command_delivered");
    if (!delivered) throw new Error("synthetic_delivery_missing");
    const duplicate = [...raw.facts, delivered].sort((a, b) => a.tick - b.tick)
      .map((fact, index) => ({ ...fact, sequence: index + 1 }));
    expect(normalizeRuntimeProductionCausality({ ...raw, facts: duplicate }).failures)
      .toContain("production_ai_delivery_lineage");
    const missingCallback = raw.facts.filter((fact) =>
      fact.kind !== "queue_resource" || fact.resource.emission.phase !== "callback");
    const result = normalizeRuntimeProductionCausality({ ...raw, facts: missingCallback });
    expect(result.failures).toContain("scoped_queue_operation_incomplete");
    expect(result.payments).toEqual([]);
    expect(normalizeRuntimeProductionCausality({ ...raw, droppedFactCount: 1 }).failures)
      .toContain("production_ai_capture_dropped");
  });

  test("an unfinished dispatch scope fails and queued admission needs no premature delivery", () => {
    const raw = productionCausalityFixture();
    expect(normalizeRuntimeProductionCausality({ ...raw, facts: raw.facts.filter((fact) =>
      fact.kind !== "intent_dispatch" || fact.event.kind !== "finished") }).failures)
      .toContain("production_ai_dispatch_scope_incomplete");
    const pending = normalizeRuntimeProductionCausality({ ...raw, facts: raw.facts.filter((fact) => fact.tick < 6) });
    expect(pending.failures).toEqual([]);
    expect(pending.commands).toHaveLength(2);
    expect(pending.commands.every((entry) => entry.deliveries.length === 0)).toBe(true);
    expect(pending.payments).toEqual([]);
  });

  test("same-tick application before the receipt preserves original observer order", () => {
    const raw = productionCausalityFixture();
    const scoped = raw.facts.filter((fact) =>
      (fact.kind === "intent_dispatch" && fact.event.correlation.intentId === "train") ||
      (fact.kind === "outcome" && fact.outcome.commandId === "train") ||
      (fact.kind === "command_delivered" && fact.command.execution?.commandId === "train") ||
      (fact.kind === "queue_resource" && fact.resource.originatingCommandContext?.execution.commandId === "train"));
    const dispatches = scoped.filter((fact) => fact.kind === "intent_dispatch");
    const request = dispatches.find((fact) => fact.event.kind === "requested");
    const finish = dispatches.find((fact) => fact.event.kind === "finished");
    const admission = scoped.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "dispatched");
    if (!request || request.event.kind !== "requested" || !request.event.acceptedIntent || !finish || !admission) {
      throw new Error("synthetic_sync_scope_missing");
    }
    const requested = { ...request, tick: 6, event: { ...request.event, proposedTick: 6,
      acceptedIntent: { ...request.event.acceptedIntent, proposedTick: 6 } } };
    const application = scoped.filter((fact) => fact.kind !== "intent_dispatch" &&
      !(fact.kind === "outcome" && fact.outcome.kind === "dispatched") && fact.tick === 6);
    const later = scoped.filter((fact) => fact.tick > 6);
    const facts = [requested, { ...admission, tick: 6 }, ...application, { ...finish, tick: 6 }, ...later]
      .map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toEqual([]);
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0].outcomes.find((fact) => fact.outcome.kind === "applied")?.sequence)
      .toBeLessThan(result.commands[0].receiptSequence);
    expect(result.payments).toHaveLength(1);
  });

  test("accepted claims must match and generic cash cannot replace missing item operations", () => {
    const raw = productionCausalityFixture();
    const changedClaims = raw.facts.map((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "requested"
      ? { ...fact, event: { ...fact.event, claims: [] } } : fact);
    expect(normalizeRuntimeProductionCausality({ ...raw, facts: changedClaims }).failures)
      .toContain("production_ai_request_receipt_lineage");
    const missingPayments = normalizeRuntimeProductionCausality({
      ...raw, facts: raw.facts.filter((fact) => fact.kind !== "queue_resource")
    });
    expect(missingPayments.payments).toEqual([]);
    expect(missingPayments.gaps).toContain("production_ai_applied_payment_missing");
  });

  test("refund cash cannot exceed the actual captured progress formula", () => {
    const raw = productionCausalityFixture("cancel_research");
    const facts = raw.facts.map((fact) => fact.kind === "queue_resource" &&
      fact.resource.operation === "cancellation_refund" ? {
        ...fact, resource: { ...fact.resource, remainingTimeMs: 1000 }
      } : fact);
    expect(normalizeRuntimeProductionCausality({ ...raw, facts }).failures)
      .toContain("production_ai_refund_progress_mismatch");
  });

  test("per-tick liabilities remain missing and immediate charge must equal stored price", () => {
    const raw = productionCausalityFixture();
    const perTick = raw.facts.map((fact) => fact.kind === "queue_resource" ? {
      ...fact, resource: { ...fact.resource, payment: "per_successful_tick" as const }
    } : fact);
    const incomplete = normalizeRuntimeProductionCausality({ ...raw, facts: perTick });
    expect(incomplete.payments).toEqual([]);
    expect(incomplete.gaps).toContain("production_ai_per_tick_liability_missing");
    const wrongPrice = raw.facts.map((fact) => fact.kind === "queue_resource" ? {
      ...fact, resource: { ...fact.resource, storedPrice: { food: 1 } }
    } : fact);
    const invalid = normalizeRuntimeProductionCausality({ ...raw, facts: wrongPrice });
    expect(invalid.failures).toContain("production_ai_charge_stored_price_mismatch");
    expect(invalid.payments).toEqual([]);
  });

  test("the report consumer exposes unresolved proof only for causal production rows", () => {
    const result = normalizeRuntimeProductionCausality(productionCausalityFixture());
    for (const scenarioId of ["PRO-03", "PRO-06", "PRO-07"]) {
      expect(evaluateRuntimeProductionCausality(scenarioId, result))
        .toContain("production_capture_gap:production_ai_event_liabilities_missing");
    }
    expect(evaluateRuntimeProductionCausality("ECO-01", result)).toEqual([]);
    expect(evaluateRuntimeProductionCausality("PRO-07", undefined)).toEqual([]);
    expect(evaluateRuntimeProductionContract("PRO-07", productionContract("PRO-07", "shared_contention"), undefined))
      .toContain("production_evidence_missing");
  });
});
