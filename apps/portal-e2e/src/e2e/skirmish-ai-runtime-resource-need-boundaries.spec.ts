import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { resourceAdmissionFixture } from "./skirmish-ai-runtime-resource-admission-fixture";
import { projectRuntimeResourceNeedAccounting } from "./skirmish-ai-runtime-resource-need-accounting-projection";

test("exact incoming read survives its start and own gather admission; other income still caps delivery", () => {
  const f = resourceAdmissionFixture(), result = projectRuntimeResourceNeedAccounting(f.capture, [f.need], [f.credit]);
  expect(result.failures).toEqual([]);
  expect(result.records[0]).toMatchObject({ closedSequence: null,
    applications: [{ observedContributionUpperBound: 3, usefulContribution: null }] });
});

for (const boundary of ["unrelated", "threw", "rejected", "reentrant", "empty", "recovery", "expiry", "legacy", "purchase"] as const) {
  test(`${boundary} cannot borrow a preserved read or own admission exemption`, () => {
    const f = resourceAdmissionFixture();
    const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (boundary === "legacy" && fact.kind === "resource_need_fence") return [{ ...fact, incomingRead: undefined }];
      if (boundary === "purchase" && fact.kind === "decision_selected" && fact.boundaryState?.unspentClaims) {
        return [{ ...fact, boundaryState: { ...fact.boundaryState, unspentClaims: { ...fact.boundaryState.unspentClaims,
          resources: { ...fact.boundaryState.unspentClaims.resources, wood: 2 } } } }];
      }
      if (fact.sequence !== 8) return [fact];
      if (fact.kind !== "intent_dispatch") throw new Error("resource_admission_finish_missing");
      if (boundary === "threw") return [{ ...fact, event: { kind: "threw", playerNumber: 1, correlation: fact.event.correlation } }];
      if (boundary === "rejected") return [{ ...fact, event: { kind: "finished", playerNumber: 1,
        correlation: fact.event.correlation, receipt: { status: "rejected", reason: "invalid_target" } } }];
      if (boundary === "unrelated") return [{ ...fact, event: { ...fact.event,
        correlation: { ...fact.event.correlation, effectId: "unrelated" } } }];
      if (boundary === "empty") return [{ ...f.selected, sequence: 8, decision: { ...f.selected.decision,
        acceptedIntents: [], gatheringSelections: [], decisions: [] } }];
      if (boundary === "reentrant") return [{ ...f.admission[0], sequence: 8 }];
      if (boundary === "expiry" || boundary === "recovery") return [{ ...fact, kind: "resource_need_fence",
        reason: "controller_decision_started", incomingRead: undefined }];
      return [fact];
    });
    const journal = facts.filter((fact) => ["recipient_resources_installed", "recipient_resource_mutation",
      "resource_input_read", "resource_need_fence"].includes(fact.kind));
    const result = projectRuntimeResourceNeedAccounting({ ...f.capture, facts, recipientResourceFacts: journal }, [f.need], [f.credit]);
    expect(result.records[0].applications[0].observedContributionUpperBound).toBeNull();
    if (boundary === "purchase") expect(result.records[0].frame).toBeNull();
  });
}

test("interference after the consumed read and terminal observation loss stay unavailable", () => {
  const f = resourceAdmissionFixture();
  const facts = f.capture.facts.map((fact) => fact.kind === "resource_need_fence" ?
    { ...fact, reason: "controller_save_restore", incomingRead: undefined } : fact);
  const capture = { ...f.capture, facts, recipientResourceFacts: f.capture.recipientResourceFacts.map((fact) =>
    facts.find((candidate) => candidate.sequence === fact.sequence) ?? fact) };
  expect(projectRuntimeResourceNeedAccounting(capture, [f.need], [f.credit]).records[0].applications[0]
    .observedContributionUpperBound).toBeNull();
  expect(projectRuntimeResourceNeedAccounting({ ...f.capture,
    resourceCoverage: { ...f.capture.resourceCoverage, lost: true, lossEpoch: 1, losses: ["reader_failed"] } },
  [f.need], [f.credit]).records[0].applications[0].observedContributionUpperBound).toBeNull();
});
