import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionDecisionFixture } from "./skirmish-ai-runtime-production-decision-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { evaluateRuntimeProductionContract } from "./skirmish-ai-runtime-production-contract-evaluation";
import { productionContract } from "./skirmish-ai-runtime-production-contract-fixtures";

test.describe("production AI decision synthetic contract tests", () => {
  test("links the exact selected result without upgrading raw authority to full production evidence", () => {
    const raw = productionDecisionFixture();
    const result = normalizeRuntimeProductionCausality(raw);
    expect(result.failures).toEqual([]);
    expect(result.commands).toHaveLength(2);
    expect(result.commands.every((entry) => entry.decision?.kind === "decision_selected")).toBe(true);
    expect(result.gaps).not.toContain("production_ai_committed_decision_link_missing");
    expect(result.gaps).toContain("production_ai_event_liabilities_missing");
    expect(result.operationBoundaries.length).toBeGreaterThan(0);
    expect(result.commands.every((entry) => entry.requestBoundary === null)).toBe(true);
    expect(result).not.toHaveProperty("productionEvidence");
    expect(evaluateRuntimeProductionContract("PRO-07", productionContract("PRO-07", "shared_contention"), undefined))
      .toContain("production_evidence_missing");
    const selected = raw.facts.find((fact) => fact.kind === "decision_selected");
    expect(result.commands[0].decision).not.toBe(selected);
  });

  test("multiple accepted commands can share one real-shaped accepting decision", () => {
    const raw = productionDecisionFixture();
    const selected = raw.facts.filter((fact) => fact.kind === "decision_selected");
    const first = selected[0];
    if (!first) throw new Error("synthetic_selected_missing");
    const decision = { ...first.decision, acceptedIntents: selected.flatMap((fact) => fact.decision.acceptedIntents),
      decisions: selected.flatMap((fact) => fact.decision.decisions) };
    const facts = raw.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (fact.kind === "decision_selected") return fact === first ? [{ ...fact, decision }] : [];
      if (fact.kind === "intent_dispatch" && fact.event.kind === "requested") return [{
        ...fact, event: { ...fact.event, decisionIdentity: decision.identity }
      }];
      return [fact];
    }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toEqual([]);
    expect(result.commands).toHaveLength(2);
    expect(result.commands.every((entry) => entry.decision?.sequence === 1)).toBe(true);
  });

  test("callback-state absence stays null and its explicit gap survives diagnostic normalization", () => {
    const raw = productionDecisionFixture();
    const facts = raw.facts.map((fact) => ({ ...fact, boundaryState: {
      resources: null, brain: null, pendingCommands: [], pendingResourceClaims: null,
      queues: null, obligations: null, gaps: ["synthetic_boundary_absent"]
    } }));
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.gaps).toContain("synthetic_boundary_absent");
    expect(result.commands[0].requestBoundary?.pendingResourceClaims).toBeNull();
    expect(result.operationBoundaries.every((fact) => fact.boundaryState?.obligations === null)).toBe(true);
    expect(result.gaps).toContain("production_ai_event_liabilities_missing");
  });

  test("missing, duplicate, contradictory and future selected results cannot prove accepted dispatch", () => {
    for (const mutation of ["missing", "duplicate", "rejected", "changed", "future", "epoch", "sequence"] as const) {
      const raw = productionDecisionFixture();
      const facts = raw.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
        if (fact.kind !== "decision_selected") return [fact];
        if (mutation === "missing") return [];
        if (mutation === "duplicate") return [fact, fact];
        if (mutation === "future") return [{ ...fact, tick: fact.tick + 1 }];
        if (mutation === "epoch") return [{ ...fact, decision: {
          ...fact.decision, identity: { ...fact.decision.identity, authorityEpoch: 10 }
        } }];
        if (mutation === "sequence") return [{ ...fact, decision: {
          ...fact.decision, identity: { ...fact.decision.identity, decisionSequence: 99 }
        } }];
        if (mutation === "changed") return [{ ...fact, decision: {
          ...fact.decision, acceptedIntents: fact.decision.acceptedIntents.map((intent) => ({ ...intent, utility: 999 }))
        } }];
        return [{ ...fact, decision: { ...fact.decision, decisions: fact.decision.acceptedIntents.map((intent) => ({
          outcome: "rejected" as const, reason: "claim_conflict" as const, detail: "synthetic", intent
        })) } }];
      }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
      const result = normalizeRuntimeProductionCausality({ ...raw, facts });
      expect(result.failures).toContain("production_ai_committed_decision_lineage");
      expect(result.payments).toEqual([]);
      expect(result.commands).toEqual([]);
    }
  });

  test("older requests leave a missing-decision gap and never borrow a neighboring result", () => {
    const raw = productionDecisionFixture();
    const facts = raw.facts.map((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "requested"
      ? { ...fact, event: { ...fact.event, decisionIdentity: undefined } } : fact);
    const result = normalizeRuntimeProductionCausality({ ...raw, facts });
    expect(result.failures).toEqual([]);
    expect(result.gaps).toContain("production_ai_committed_decision_link_missing");
    expect(result.commands.every((entry) => entry.decision === null)).toBe(true);
  });
});
