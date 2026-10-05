import { expect, test } from "@playwright/test";
import { normalizeRuntimeProductionInitialQueues } from "./skirmish-ai-runtime-production-initial-queue-normalization";
import { productionWorldFixture } from "./skirmish-ai-runtime-production-world-fixture";

test.describe("initial production queue synthetic contract tests", () => {
  for (const payment of ["immediate", "tick"] as const) {
    test(`joins native insertion and isolated balances before a reset: ${payment}`, () => {
      const { capture, setup } = productionWorldFixture(payment);
      const result = normalizeRuntimeProductionInitialQueues(capture, setup);
      expect(result.failures).toEqual([]);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].state).toBe(payment === "immediate" ? "paid_immediate" : "unpaid_per_tick");
      expect(result.items[0].paymentSequence === null).toBe(payment === "tick");
      expect(result.items[0].setupApplication.resourcesAfter.food).toBe(payment === "immediate" ? 93 : 100);
      expect(capture.snapshots[0].resources.food).toBe(25);
      expect(result.gaps).toContain("production_initial_queue_pre_capture_or_uncommanded");
    });
  }

  test("later same-item payment/lifecycle facts cannot rewrite paused setup provenance", () => {
    const { capture, setup } = productionWorldFixture();
    capture.facts.push(...capture.facts.map((fact) => ({ ...fact, tick: 1, sequence: fact.sequence + 100 })));
    const result = normalizeRuntimeProductionInitialQueues(capture, setup);
    expect(result.failures).toEqual([]);
    expect(result.items[0].state).toBe("paid_immediate");
  });

  for (const absent of ["setup", "tick_zero", "insertion", "payment"] as const) {
    test(`keeps missing ${absent} authority gapped`, () => {
      const { capture, setup } = productionWorldFixture();
      if (absent === "tick_zero") capture.snapshots[0].tick = 1;
      if (absent === "insertion") capture.facts = capture.facts.filter((fact) => fact.kind !== "queue_mutation");
      if (absent === "payment") capture.facts = capture.facts.filter((fact) => fact.kind !== "queue_resource");
      const result = normalizeRuntimeProductionInitialQueues(capture, absent === "setup" ? undefined : setup);
      expect(result.items).toEqual([]);
      expect(result.failures).toEqual([]);
      expect(result.gaps.length).toBeGreaterThan(0);
    });
  }

  for (const defect of [
    "restore", "duplicate", "command", "reset_as_payment", "price", "terminal", "physical", "partial_payment", "order"
  ] as const) {
    test(`fails supplied inconsistent ${defect} evidence`, () => {
      const { capture, setup } = productionWorldFixture();
      if (defect === "restore") capture.snapshots[0].world.snapshotRestoreInProgress = true;
      if (defect === "duplicate") setup.queueApplications.push(setup.queueApplications[0]);
      if (defect === "command") setup.queueApplications[0].command = {
        ...setup.queueApplications[0].command, actorIds: ["other-producer"] };
      if (defect === "reset_as_payment") setup.queueApplications[0].resourcesAfter.food = 25;
      if (defect === "price") capture.snapshots[0].world.catalog[0].cost = { food: 8 };
      if (defect === "terminal") setup.queueApplications[0].outcomes = setup.queueApplications[0].outcomes.map((outcome) =>
        ({ ...outcome, kind: "completed" as const }));
      if (defect === "physical") capture.facts = capture.facts.map((fact) => fact.kind === "queue_mutation" &&
        fact.mutation.phase === "after" ? { ...fact, boundaryState: { ...fact.boundaryState,
          resources: { food: 99, wood: 100, stone: 100, minerals: 100 }, brain: null, pendingCommands: [],
          pendingResourceClaims: null, queues: fact.boundaryState?.queues ?? null,
          obligations: fact.boundaryState?.obligations ?? null, gaps: [] } } : fact);
      if (defect === "partial_payment") capture.facts = capture.facts.filter((fact) =>
        fact.kind !== "queue_resource" || fact.resource.emission.phase !== "callback");
      if (defect === "order") capture.facts = capture.facts.map((fact) => fact.kind === "outcome" &&
        fact.outcome.kind === "applied" ? { ...fact, sequence: 1 } : fact);
      const result = normalizeRuntimeProductionInitialQueues(capture, setup);
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.items).toEqual([]);
    });
  }
});
