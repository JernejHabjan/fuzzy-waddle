import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { constructionDecisionFixture } from "./skirmish-ai-runtime-construction-decision-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

test("joins two addressed builders, actual selected intent, stamp and native path without a reachability verdict", () => {
  const result = normalizeRuntimeProductionCausality(constructionDecisionFixture());
  expect(result.failures).toEqual([]);
  expect(result.spatialAuthority.paths[0]?.constructionCommand).toMatchObject({
    requestedTick: 18,
    acceptedIntent: { kind: "construct", builderIds: ["builder", "other-builder"], demandId: "demand:force" },
    command: { tick: 20, execution: { commandId: "construction" } },
    decision: { sequence: 1 }
  });
  expect(result.gaps).not.toContain("production_spatial_construction_ai_decision_link_missing");
  expect(result.gaps).toContain("production_spatial_navigation_revision_missing");
  expect(result.gaps).toContain("production_spatial_full_producer_reachability_missing");
});

test("actual late construction application retains the intended command tick separately", () => {
  const capture = constructionDecisionFixture();
  const facts = capture.facts.map((fact): AiRuntimeProductionFactV1 => {
    if (fact.tick !== 20) return fact;
    if (fact.kind === "spatial_authority") return { ...fact, tick: 21, spatial: { ...fact.spatial, clockTick: 21 } };
    if (fact.kind === "outcome") return { ...fact, tick: 21, outcome: { ...fact.outcome, tick: 21 } };
    return { ...fact, tick: 21 };
  });
  const result = normalizeRuntimeProductionCausality({ ...capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.spatialAuthority.paths[0]?.constructionCommand?.command.tick).toBe(20);
});

test("legacy missing selected identity retains only its native placement join", () => {
  const capture = constructionDecisionFixture();
  const facts = capture.facts.map(
    (fact): AiRuntimeProductionFactV1 =>
      fact.kind === "intent_dispatch" && fact.event.kind === "requested"
        ? { ...fact, event: { ...fact.event, decisionIdentity: undefined } }
        : fact
  );
  const result = normalizeRuntimeProductionCausality({ ...capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.spatialAuthority.paths[0]?.constructionPlacement).not.toBeNull();
  expect(result.spatialAuthority.paths[0]?.constructionCommand).toBeNull();
  expect(result.gaps).toContain("production_spatial_construction_ai_decision_link_missing");
});

test("a failed prior attempt with the same effect cannot steal the later accepted request", () => {
  const capture = constructionDecisionFixture();
  const request = capture.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "requested");
  if (!request || request.kind !== "intent_dispatch") throw new Error("synthetic_request_missing");
  const priorFinish = {
    ...request,
    event: { kind: "threw", playerNumber: 1, correlation: request.event.correlation }
  } satisfies AiRuntimeProductionFactV1;
  const facts = [request, priorFinish, ...capture.facts].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.spatialAuthority.paths[0]?.constructionCommand?.requestedSequence).toBe(4);
});

test("a receipt observed only after the path resolved cannot backfill that interval", () => {
  const capture = constructionDecisionFixture();
  const receipt = capture.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished");
  if (!receipt) throw new Error("synthetic_receipt_missing");
  // Keep all facts at one tick so the failure exercises observer order rather than monotonic-clock rejection.
  const facts = [...capture.facts.filter((fact) => fact !== receipt), receipt].map(
    (fact, index): AiRuntimeProductionFactV1 => {
      if (fact.kind === "intent_dispatch" && fact.event.kind === "requested" && fact.event.acceptedIntent) {
        return {
          ...fact,
          tick: 20,
          sequence: index + 1,
          event: {
            ...fact.event,
            decisionIdentity: fact.event.decisionIdentity ? { ...fact.event.decisionIdentity, tick: 20 } : undefined
          }
        };
      }
      if (fact.kind === "decision_selected")
        return {
          ...fact,
          tick: 20,
          sequence: index + 1,
          decision: { ...fact.decision, identity: { ...fact.decision.identity, tick: 20 } }
        };
      return { ...fact, tick: 20, sequence: index + 1 };
    }
  );
  const result = normalizeRuntimeProductionCausality({ ...capture, facts });
  expect(result.failures).toContain("production_spatial_construction_dispatch_interval_invalid");
  expect(result.spatialAuthority.paths).toEqual([]);
});

for (const defect of ["decision", "builders", "site", "stamp", "admission", "duplicate_receipt"] as const) {
  test(`contradictory ${defect} construction suppresses the complete normalized effect group`, () => {
    const capture = constructionDecisionFixture();
    let facts = capture.facts.map((fact): AiRuntimeProductionFactV1 => {
      if (defect === "decision" && fact.kind === "decision_selected") {
        return { ...fact, decision: { ...fact.decision, acceptedIntents: [] } };
      }
      if (
        fact.kind === "intent_dispatch" &&
        fact.event.kind === "requested" &&
        fact.event.acceptedIntent?.kind === "construct"
      ) {
        const intent = fact.event.acceptedIntent;
        if (defect === "builders")
          return { ...fact, event: { ...fact.event, acceptedIntent: { ...intent, builderIds: ["builder"] } } };
        if (defect === "site")
          return { ...fact, event: { ...fact.event, acceptedIntent: { ...intent, siteKey: "other" } } };
      }
      if (defect === "stamp" && fact.kind === "command_delivered" && fact.command.execution) {
        return { ...fact, command: { ...fact.command, execution: { ...fact.command.execution, effectId: "other" } } };
      }
      if (defect === "admission" && fact.kind === "outcome" && fact.outcome.kind === "dispatched") {
        return { ...fact, scheduledTick: 21 };
      }
      return fact;
    });
    if (defect === "duplicate_receipt")
      facts = facts.flatMap((fact) =>
        fact.kind === "intent_dispatch" && fact.event.kind === "finished" ? [fact, fact] : [fact]
      );
    const result = normalizeRuntimeProductionCausality({
      ...capture,
      facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 }))
    });
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.spatialAuthority.paths).toEqual([]);
    expect(result.effectRetention).toEqual([]);
    expect(result.completions).toEqual([]);
    expect(result.worldSnapshots).toEqual([]);
  });
}
