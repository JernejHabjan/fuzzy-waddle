import { expect, test } from "@playwright/test";
import { calculateRuntimeResourceContribution } from "./calculate-runtime-resource-contribution";
import { normalizeRuntimeRecipientMutations } from "./skirmish-ai-runtime-recipient-mutations";
import { projectRuntimeResourceNeedAccounting } from "./skirmish-ai-runtime-resource-need-accounting-projection";
import { recipientJournalFixture } from "./skirmish-ai-runtime-recipient-journal-fixture";
import { resourceServiceFixture } from "./skirmish-ai-runtime-resource-service-fixture";
import { normalizeRuntimeResourceNeeds } from "./skirmish-ai-runtime-resource-need-normalization";
import { resourceNeedAccountingFixture } from "./skirmish-ai-runtime-resource-need-accounting-fixture";

test("other income followed by spending cannot reopen the old shortage; existing liabilities cap marginal gain", () => {
  const input = { forecast: 10, initialStock: 0, reserved: 0, obligations: 0, positiveIncomeBefore: 7,
    stockBefore: 0, stockAfter: 7, eligibleAmount: 7 };
  expect(calculateRuntimeResourceContribution(input)).toMatchObject({ unresolvedBefore: 3, contribution: 3 });
  expect(calculateRuntimeResourceContribution({ ...input, positiveIncomeBefore: 10 })).toMatchObject({ contribution: 0 });
  expect(calculateRuntimeResourceContribution({ ...input, positiveIncomeBefore: 0, obligations: 10 })).toMatchObject({ contribution: 0 });
  expect(calculateRuntimeResourceContribution({ ...input, positiveIncomeBefore: NaN })).toBeNull();
});

test("journal consumes paired actual applications once and never sums duplicate resources_applied diagnostics", () => {
  const { capture } = recipientJournalFixture();
  const result = normalizeRuntimeRecipientMutations(capture);
  expect(result.failures).toEqual([]); expect(result.gaps).toEqual([]); expect(result.operations).toHaveLength(1);
  const repeated = { ...capture, recipientResourceFacts: [...capture.recipientResourceFacts, capture.facts[3]] };
  expect(normalizeRuntimeRecipientMutations(repeated)).toMatchObject({ operations: [],
    failures: ["production_recipient_journal_order_invalid"] });
});

test("missing input or liability authority stays unavailable, and accepting-result target replacement closes immediately", () => {
  const { capture } = resourceServiceFixture();
  const needs = normalizeRuntimeResourceNeeds(capture).needs;
  const result = projectRuntimeResourceNeedAccounting(capture, needs, []);
  expect(result.records[0]).toMatchObject({ frame: null, closedSequence: needs[0].selectedSequence });
  expect(result.records[0].gaps).toContain("production_need_exact_input_read_missing");
  expect(result.gaps).toContain("resource_recipient_mutable_alias_history_incomplete");
});

test("all supplied conflicting tails invalidate the parent rather than exposing a normalized journal prefix", () => {
  const { capture } = recipientJournalFixture();
  const bad = { ...capture.facts[3], sequence: 5 };
  const changed = { ...capture, recipientResourceFacts: [...capture.recipientResourceFacts, bad],
    resourceCoverage: { ...capture.resourceCoverage, frontier: { tick: 0, captureSequence: 5 } } };
  expect(normalizeRuntimeRecipientMutations(changed).failures).toContain("production_recipient_terminal_conflict");
  expect(normalizeRuntimeRecipientMutations(changed).operations).toEqual([]);
});

test("replayed other income and spending cap a later whole-pile delivery, while useful authority stays null", () => {
  const { capture, need, credit } = resourceNeedAccountingFixture();
  const result = projectRuntimeResourceNeedAccounting(capture, [need], [credit]);
  expect(result.failures).toEqual([]);
  expect(result.records[0].applications[0]).toMatchObject({ operationId: 3,
    observedPositiveIncomeBefore: 7, observedUnresolvedUpperBound: 3, observedContributionUpperBound: 3,
    usefulContribution: null });
  expect(result.gaps).toContain("resource_need_lifecycle_routes_incomplete");
  const lateCredit = { ...credit, fact: { ...credit.fact, sequence: 12 } };
  const fence = { kind: "resource_need_fence" as const, sequence: 11, tick: 0, playerNumber: 1, reason: "controller_disabled" };
  const late = { ...capture, facts: [...capture.facts.slice(0, -1), fence, lateCredit.fact],
    recipientResourceFacts: [...capture.recipientResourceFacts, fence],
    resourceCoverage: { ...capture.resourceCoverage, frontier: { tick: 0, captureSequence: 12 } } };
  expect(projectRuntimeResourceNeedAccounting(late, [need], [lateCredit]).records[0].applications[0])
    .toMatchObject({ observedContributionUpperBound: 3, usefulContribution: null });
});
