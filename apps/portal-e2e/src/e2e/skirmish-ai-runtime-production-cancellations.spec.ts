import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";
import { productionPerTickCancellationFixture } from "./skirmish-ai-runtime-per-tick-cancellation-fixture";
import { researchQueueMutationFixture } from "./skirmish-ai-runtime-research-queue-mutation-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

/** Synthetic contracts; actual AI policy, useful replacement and both-faction legality remain unproven. */
test.describe("native cancellation lifecycle synthetic contracts", () => {
  for (const family of ["production", "research", "per_tick"] as const) {
    test(`${family} joins the original paid item to its distinct cancel request, removal, refund and terminals`, () => {
      const source =
        family === "research"
          ? researchQueueMutationFixture()
          : family === "per_tick"
            ? productionPerTickCancellationFixture()
            : productionQueueMutationFixture("cancel");
      const result = normalizeRuntimeProductionCausality(source);
      expect(result.failures).toEqual([]);
      expect(result.cancellations).toHaveLength(1);
      const lifecycle = requireAiTestEntry(result.cancellations, 0);
      expect(lifecycle).toMatchObject({
        commandId: "cancel",
        originatingCommandId: "purchase",
        requestedTick: 8,
        scheduledTick: 10,
        terminalTick: 10,
        item: { remainingTimeMs: 100 },
        refund: { refundAmounts: { food: family === "production" ? 7 : 4 } }
      });
      expect(lifecycle.requestedSequence).toBeLessThan(requireAiTestEntry(lifecycle.removal.boundarySequences, 0));
      expect(lifecycle.originatingTerminalSequence).toBeGreaterThan(lifecycle.removal.sequence);
      expect(lifecycle.cancellationTerminalSequence).toBeGreaterThan(lifecycle.originatingTerminalSequence);
      expect(lifecycle.cancellationTerminalSequence).toBeGreaterThan(lifecycle.refund.sequence);
      if (family === "research")
        expect(lifecycle.refund.sequence).toBeLessThan(requireAiTestEntry(lifecycle.removal.boundarySequences, 0));
      else
        expect(requireAiTestEntry(lifecycle.refund.boundarySequences, 0)).toBeGreaterThan(
          lifecycle.originatingTerminalSequence
        );
      expect(lifecycle.paidOperationSequences).toHaveLength(1);
      expect(result.gaps).not.toContain("production_ai_cancel_lifecycle_authority_missing");
      expect(result.gaps).toContain("production_ai_event_liabilities_missing");
      expect(result).not.toHaveProperty("productionEvidence");
      if (family === "per_tick") {
        expect(lifecycle.removal).toMatchObject({
          reservedUnspentAfter: { food: 0 },
          obligationsDue: { food: 25 },
          obligationsAfter: { food: 11 }
        });
        expect(lifecycle.refund).toMatchObject({
          resourcesBefore: { food: 93 },
          resourcesAfter: { food: 97 },
          obligationsDue: { food: 11 },
          obligationsAfter: { food: 11 },
          charged: { food: 0 }
        });
        expect(result.operations.find((entry) => entry.kind === "tick_charge")?.charged.food).toBe(7);
        expect(result.gaps).not.toContain("production_ai_per_tick_refund_authority_missing");
        expect(result.gaps).not.toContain("production_ai_operation_queue_transfer_missing");
      }
    });
  }

  for (const missing of ["insertion", "removal", "refund", "terminal", "paid_progress"] as const) {
    test(`missing ${missing} remains a gap without credit from a later snapshot or native terminal`, () => {
      const source = productionPerTickCancellationFixture();
      const facts = source.facts.filter(
        (entry) =>
          !(missing === "insertion" && entry.kind === "queue_mutation" && entry.mutation.operation === "enqueue") &&
          !(missing === "removal" && entry.kind === "queue_mutation" && entry.mutation.operation === "cancel_remove") &&
          !(
            missing === "refund" &&
            entry.kind === "queue_resource" &&
            entry.resource.operation === "cancellation_refund"
          ) &&
          !(
            missing === "terminal" &&
            entry.kind === "outcome" &&
            entry.outcome.commandId === "cancel" &&
            entry.outcome.kind === "cancelled"
          ) &&
          !(
            missing === "paid_progress" &&
            (entry.kind === "queue_progress" ||
              (entry.kind === "queue_resource" && entry.resource.operation === "tick_charge"))
          )
      );
      const result = normalizeRuntimeProductionCausality({ ...source, facts });
      expect(result.failures).toEqual([]);
      expect(result.cancellations).toEqual([]);
      expect(result.gaps.some((gap) => gap.includes("cancel_"))).toBe(true);
      if (missing === "removal") expect(result.gaps).toContain("production_ai_cancel_lifecycle_authority_missing");
    });
  }

  for (const defect of [
    "refund_overcredit",
    "different_item",
    "stored_price",
    "payment_mode",
    "restore",
    "terminal_kind",
    "terminal_world_link",
    "terminal_before_refund",
    "refund_before_purchase_terminal",
    "duplicate_refund"
  ] as const) {
    test(`contradictory ${defect} suppresses every normalized effect`, () => {
      const source = productionPerTickCancellationFixture();
      let facts = source.facts.map((entry): AiRuntimeProductionFactV1 => {
        if (entry.kind === "queue_resource" && entry.resource.operation === "cancellation_refund") {
          const value = entry.resource;
          if (defect === "different_item") return { ...entry, resource: { ...value, itemId: "foreign" } };
          if (defect === "stored_price") return { ...entry, resource: { ...value, storedPrice: { food: 8 } } };
          if (defect === "payment_mode") return { ...entry, resource: { ...value, payment: "immediate" } };
          if (defect === "restore")
            return {
              ...entry,
              resource: {
                ...value,
                emission: {
                  ...value.emission,
                  snapshotRestoreInProgress: true
                }
              }
            };
          if (defect === "refund_overcredit") {
            const emission = value.emission;
            return {
              ...entry,
              resource: {
                ...value,
                emission: {
                  ...emission,
                  requested: { food: 14 },
                  ...(emission.phase === "callback" ? { amounts: { food: 14 } } : {}),
                  ...(emission.phase === "finished"
                    ? { after: { food: 107, wood: 100, stone: 100, minerals: 100 } }
                    : {})
                }
              },
              boundaryState: entry.boundaryState
                ? {
                    ...entry.boundaryState,
                    resources:
                      emission.phase === "started"
                        ? entry.boundaryState.resources
                        : { food: 107, wood: 100, stone: 100, minerals: 100 }
                  }
                : undefined
            };
          }
        }
        if (entry.kind === "outcome" && entry.outcome.commandId === "cancel" && entry.outcome.kind === "cancelled") {
          if (defect === "terminal_kind") return { ...entry, outcome: { ...entry.outcome, kind: "completed" } };
          if (defect === "terminal_world_link")
            return { ...entry, outcome: { ...entry.outcome, worldLinkIds: ["foreign"] } };
        }
        return entry;
      });
      const refunds = facts.filter(
        (entry) => entry.kind === "queue_resource" && entry.resource.operation === "cancellation_refund"
      );
      if (defect === "terminal_before_refund") {
        const terminal = facts.find(
          (entry) =>
            entry.kind === "outcome" && entry.outcome.commandId === "cancel" && entry.outcome.kind === "cancelled"
        );
        if (!terminal) throw new Error("synthetic_terminal_missing");
        facts = facts.flatMap((entry) =>
          entry === terminal ? [] : entry === requireAiTestEntry(refunds, 0) ? [terminal, entry] : [entry]
        );
      }
      if (defect === "refund_before_purchase_terminal") {
        const terminal = facts.find(
          (entry) =>
            entry.kind === "outcome" && entry.outcome.commandId === "purchase" && entry.outcome.kind === "cancelled"
        );
        if (!terminal) throw new Error("synthetic_terminal_missing");
        facts = facts.flatMap((entry) =>
          entry === terminal ? [...refunds, entry] : refunds.includes(entry) ? [] : [entry]
        );
      }
      if (defect === "duplicate_refund")
        facts = [
          ...facts,
          ...refunds.map(
            (entry): AiRuntimeProductionFactV1 =>
              entry.kind === "queue_resource"
                ? {
                    ...entry,
                    resource: { ...entry.resource, emission: { ...entry.resource.emission, operationId: 6 } }
                  }
                : entry
          )
        ];
      const result = normalizeRuntimeProductionCausality({
        ...source,
        facts: facts.map((entry, index) => ({ ...entry, sequence: index + 1 }))
      });
      expect(result.failures.length).toBeGreaterThan(0);
      for (const values of [
        result.cancellations,
        result.completions,
        result.rejections,
        result.operations,
        result.payments,
        result.queueMutations
      ])
        expect(values).toEqual([]);
    });
  }
});
