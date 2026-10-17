import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { rejectionRetryFixture } from "./skirmish-ai-runtime-rejection-retry-fixture";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionRejectionFixture } from "./skirmish-ai-runtime-production-rejection-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

test.describe("production native rejection synthetic contracts", () => {
  for (const stage of ["admission", "stamped_admission", "application", "bus_application"] as const) {
    test(`retains exact rejection and claim release without queue authority: ${stage}`, () => {
      const raw = productionRejectionFixture(stage);
      const result = normalizeRuntimeProductionCausality(raw);
      expect(result.failures).toEqual([]);
      expect(result.rejections).toHaveLength(1);
      const rejection = requireAiTestEntry(result.rejections, 0);
      expect(rejection).toMatchObject({
        stage: stage.includes("admission") ? "admission" : "application",
        requestedTick: 4,
        reason: "invalid_owner",
        commandId: stage === "admission" ? null : "purchase",
        scheduledTick: stage.includes("admission") ? null : 6,
        resourcesBefore: { food: 100 },
        resourcesAfter: { food: 100 },
        reservedUnspentBefore: { food: 7 },
        reservedUnspentAfter: { food: 0 }
      });
      expect(result.payments).toEqual([]);
      expect(result.operations).toEqual([]);
      expect(result.queueMutations).toEqual([]);
      expect(result.commands).toHaveLength(stage.includes("admission") ? 0 : 1);
      expect(result.gaps).toEqual(expect.arrayContaining(raw.gaps));
      expect(result.gaps).toContain("production_ai_event_liabilities_missing");
      expect(result).not.toHaveProperty("productionEvidence");
      const request = requireAiTestEntry(raw.facts, 1);
      if (request.kind !== "intent_dispatch" || request.event.kind !== "requested")
        throw new Error("synthetic_request_missing");
      expect(rejection.request).not.toBe(request.event.command);
    });
  }

  test("a rejected unstamped attempt cannot borrow a later retry's native command or outcome", () => {
    const result = normalizeRuntimeProductionCausality(rejectionRetryFixture());
    expect(result.failures).toEqual([]);
    expect(result.rejections.map((entry) => [entry.requestedTick, entry.commandId, entry.scheduledTick])).toEqual([
      [4, null, null],
      [8, "purchase-retry", 10]
    ]);
    expect(
      result.rejections.every(
        (entry) => entry.reservedUnspentBefore?.food === 7 && entry.reservedUnspentAfter?.food === 0
      )
    ).toBe(true);
  });

  test("native physical insertion contradicts application rejection even if money is absent", () => {
    const raw = productionRejectionFixture("application");
    const mutations = productionQueueMutationFixture("immediate").facts.filter(
      (fact) => fact.kind === "queue_mutation"
    );
    const facts = [...raw.facts, ...mutations]
      .sort((a, b) => a.tick - b.tick)
      .map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toContain("production_ai_rejection_native_effect");
    expect(result.rejections).toEqual([]);
    expect(result.queueMutations).toEqual([]);
  });

  test("research rejection uses its actual accepted tech payload and native claim release", () => {
    for (const stage of ["admission", "application"] as const) {
      const result = normalizeRuntimeProductionCausality(productionRejectionFixture(stage, "research"));
      expect(result.failures).toEqual([]);
      expect(requireAiTestEntry(result.rejections, 0).acceptedIntent.kind).toBe("research");
      expect(requireAiTestEntry(result.rejections, 0).request.type).toBe("RESEARCH");
      expect(requireAiTestEntry(result.rejections, 0).reservedUnspentAfter?.food).toBe(0);
      expect(result.gaps).toContain("production_ai_definition_catalog_missing");
    }
  });

  test("single-player rejection and delivery can precede the finished receipt", () => {
    const raw = productionRejectionFixture("application");
    const finish = raw.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished");
    if (!finish) throw new Error("synthetic_receipt_missing");
    const facts = raw.facts
      .filter((fact) => fact !== finish)
      .concat(finish)
      .map((fact, index): AiRuntimeProductionFactV1 => {
        const base = { ...fact, sequence: index + 1, tick: 4 };
        if (fact.kind === "outcome")
          return {
            ...base,
            kind: fact.kind,
            outcome: { ...fact.outcome, tick: 4 },
            scheduledTick: fact.scheduledTick === null ? null : 4
          };
        if (fact.kind === "command_delivered")
          return { ...base, kind: fact.kind, command: { ...fact.command, tick: 4 } };
        if (
          fact.kind === "intent_dispatch" &&
          fact.event.kind === "finished" &&
          fact.event.receipt.status === "dispatched"
        ) {
          return {
            ...base,
            kind: fact.kind,
            event: {
              ...fact.event,
              receipt: { ...fact.event.receipt, command: { ...fact.event.receipt.command, tick: 4 } }
            }
          };
        }
        return base;
      });
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toEqual([]);
    expect(requireAiTestEntry(result.rejections, 0).sequence).toBeLessThan(
      requireAiTestEntry(result.rejections, 0).receiptSequence
    );
    expect(requireAiTestEntry(result.rejections, 0).reservedUnspentAfter?.food).toBe(0);
  });

  test("missing pre-callback state remains null, never borrowing a settled snapshot", () => {
    const raw = productionRejectionFixture();
    const result = normalizeRuntimeProductionCausality({
      ...raw,
      facts: raw.facts.map((fact) =>
        fact.kind === "intent_dispatch" && fact.event.kind === "finished"
          ? { ...fact, boundaryStateBefore: undefined }
          : fact
      )
    });
    expect(result.failures).toEqual([]);
    expect(requireAiTestEntry(result.rejections, 0).resourcesBefore).toBeNull();
    expect(requireAiTestEntry(result.rejections, 0).reservedUnspentBefore).toBeNull();
    expect(result.gaps).toContain("production_ai_rejection_boundary_missing");
  });

  test("forged selection, correlation, cash, liabilities, release and restore suppress normalized evidence", () => {
    for (const change of ["selection", "correlation", "cash", "liability", "release", "restore"] as const) {
      const raw = productionRejectionFixture();
      const facts = raw.facts.map((fact): AiRuntimeProductionFactV1 => {
        if (change === "selection" && fact.kind === "decision_selected")
          return {
            ...fact,
            decision: {
              ...fact.decision,
              acceptedIntents: []
            }
          };
        if (fact.kind !== "intent_dispatch" || fact.event.kind !== "finished" || !fact.boundaryState) return fact;
        if (change === "correlation")
          return {
            ...fact,
            event: {
              ...fact.event,
              correlation: {
                ...fact.event.correlation,
                commitmentKey: "forged"
              }
            }
          };
        const state = fact.boundaryState;
        return {
          ...fact,
          boundaryState: {
            ...state,
            ...(change === "cash" ? { resources: { food: 101, wood: 100, stone: 100, minerals: 100 } } : {}),
            ...(change === "liability" ? { obligations: { food: 999, wood: 0, stone: 0, minerals: 0 } } : {}),
            ...(change === "restore" ? { snapshotRestoreInProgress: true } : {}),
            ...(change === "release" ? { unspentClaims: fact.boundaryStateBefore?.unspentClaims } : {})
          }
        };
      });
      const result = normalizeRuntimeProductionCausality({ ...raw, facts });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.rejections).toEqual([]);
      expect(result.payments).toEqual([]);
      expect(result.operations).toEqual([]);
      expect(result.queueMutations).toEqual([]);
    }
  });

  test("conflicting success, duplicate rejection, uncertain authority and wrong native stamp fail closed", () => {
    for (const change of ["success", "duplicate", "uncertain", "stamp"] as const) {
      const raw = productionRejectionFixture("application");
      const rejected = raw.facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "rejected");
      if (!rejected || rejected.kind !== "outcome") throw new Error("synthetic_rejection_missing");
      const facts: AiRuntimeProductionFactV1[] = raw.facts
        .flatMap((fact): AiRuntimeProductionFactV1[] => {
          if (fact !== rejected) return [fact];
          if (change === "success") return [fact, { ...rejected, outcome: { ...rejected.outcome, kind: "applied" } }];
          if (change === "duplicate") return [fact, fact];
          return [
            {
              ...rejected,
              outcome: {
                ...rejected.outcome,
                ...(change === "uncertain" ? { reason: "duplicate_command" as const } : { authorityEpoch: 99 })
              }
            }
          ];
        })
        .map((fact, index) => ({ ...fact, sequence: index + 1 }));
      const result = normalizeRuntimeProductionCausality({ ...raw, facts });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.rejections).toEqual([]);
    }
  });
});
