import { expect, test } from "@playwright/test";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { productionCompletionFixture } from "./skirmish-ai-runtime-production-completion-fixture";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";
import { projectRuntimeProductionLifecycleEvents } from "./skirmish-ai-runtime-production-lifecycle-events";

for (const family of ["production", "research"] as const) {
  test(`${family} checked lifecycle connects insertion, successful charges and exact registered completion`, () => {
    const raw = productionCompletionFixture(family);
    const causal = normalizeRuntimeProductionCausality(raw);
    expect(causal.failures).toEqual([]);
    const events = causal.queueLifecycleEvents ?? [];
    expect(events.filter((event) => event.kind === "enqueue")).toHaveLength(1);
    const completion = events.find((event) => event.kind === "complete");
    expect(completion?.itemId).toBe(causal.completions[0]?.itemId);
    expect(completion?.sequence).toBe(causal.completions[0]?.registeredSequence);
    expect(completion?.createdActorId).toBe(family === "production" ? "synthetic-created-actor" : null);
    expect(
      events.every((event, index) => index === 0 || event.sequence > (events[index - 1]?.sequence ?? Infinity))
    ).toBe(true);
    expect(causal).not.toHaveProperty("productionEvidence");
  });
}

test("missing completion cash or claim authority cannot become a zero-valued event", () => {
  const raw = productionCompletionFixture();
  const causal = normalizeRuntimeProductionCausality(raw);
  const sequence = causal.completions[0]?.registeredSequence;
  const partial = {
    ...raw,
    facts: raw.facts.map((fact) => (fact.sequence === sequence ? { ...fact, boundaryState: undefined } : fact))
  };
  const result = projectRuntimeProductionLifecycleEvents(partial, causal);
  expect(result.events.some((event) => event.kind === "complete")).toBe(false);
  expect(result.gaps).toContain("production_ai_lifecycle_boundary_missing");
});

test("native cancellation request, removal and refund keep their distinct observer sequences", () => {
  const raw = productionQueueMutationFixture("cancel");
  const causal = normalizeRuntimeProductionCausality(raw);
  expect(causal.failures).toEqual([]);
  const cancellation = causal.cancellations[0];
  expect(cancellation).toBeDefined();
  // The legacy synthetic request omits its boundary. Production must keep that gap, never borrow another callback.
  expect(causal.queueLifecycleEvents?.some((event) => event.kind === "cancel_requested")).toBe(false);
  expect(causal.gaps).toContain("production_ai_lifecycle_refund_authority_missing");
  const paid = raw.facts.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "finished");
  if (!paid?.boundaryState || !cancellation) throw new Error("synthetic_paid_boundary_missing");
  // Pure contract input: explicitly supply the missing pre-request state; this never enters a native runtime capture.
  const complete = {
    ...raw,
    facts: raw.facts.map((fact) =>
      fact.sequence === cancellation.requestedSequence
        ? { ...fact, boundaryState: structuredClone(paid.boundaryState) }
        : fact
    )
  };
  const events = projectRuntimeProductionLifecycleEvents(complete, causal).events;
  expect(events.find((event) => event.kind === "cancel_requested")?.sequence).toBe(cancellation?.requestedSequence);
  expect(events.find((event) => event.kind === "cancel")?.sequence).toBe(cancellation?.removal.sequence);
  const refund = events.find((event) => event.kind === "refund");
  expect(refund?.sequence).toBe(cancellation?.refund.sequence);
  expect(refund?.refundForItemId).toBe(cancellation?.item.itemId);
  expect(refund?.refundAmounts).toEqual(cancellation?.refund.refundAmounts);
});

test("dropped capture and duplicate event order fail closed", () => {
  const raw = productionCompletionFixture();
  const causal = normalizeRuntimeProductionCausality(raw);
  expect(projectRuntimeProductionLifecycleEvents({ ...raw, droppedFactCount: 1 }, causal).events).toEqual([]);
  const repeated = { ...causal, enqueues: [...(causal.enqueues ?? []), ...(causal.enqueues ?? [])] };
  expect(projectRuntimeProductionLifecycleEvents(raw, repeated)).toMatchObject({
    events: [],
    failures: ["production_ai_lifecycle_event_order"]
  });
});
