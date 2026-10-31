import { expect, test } from "@playwright/test";
import { normalizeMultiplayerQueueBoundary } from "./skirmish-ai-multiplayer-queue-normalization";
import { multiplayerQueueBoundaryFixture } from "./skirmish-ai-multiplayer-queue-fixture";

test.describe("multiplayer shared queue boundary normalization (synthetic contract tests)", () => {
  test("retains scoped facts and distinct purchase/cancel IDs without manufacturing full production evidence", () => {
    const result = normalizeMultiplayerQueueBoundary(multiplayerQueueBoundaryFixture(), true);
    expect(result.failures).toEqual([]);
    expect(result.payments.map((payment) => [payment.purchaseCommandId, payment.cancellationCommandId]))
      .toEqual([["purchase", null], ["purchase", "cancel"], ["resume", null]]);
    expect(result).not.toHaveProperty("productionEvidence");
  });

  test("allows a remote observer without inventing a sender request", () => {
    const world = multiplayerQueueBoundaryFixture();
    expect(normalizeMultiplayerQueueBoundary({ ...world, requests: [] }, false).failures).toEqual([]);
    expect(normalizeMultiplayerQueueBoundary({ ...world, requests: [] }, true).failures)
      .toContain("queue_boundary_pending_request_missing");
  });

  for (const requestedTick of [10, 11]) {
    test(`rejects cancellation requested at tick ${requestedTick} after the pre-credit window`, () => {
      const world = multiplayerQueueBoundaryFixture();
      expect(normalizeMultiplayerQueueBoundary({ ...world,
        requests: world.requests.map((request) => ({ ...request, requestedTick })) }, true).failures)
        .toContain("queue_boundary_pending_request_missing");
    });
  }

  test("rejects a same-tick cancellation/probe even with matching cash", () => {
    const world = multiplayerQueueBoundaryFixture();
    expect(normalizeMultiplayerQueueBoundary({ ...world,
      commands: world.commands.map((entry) => entry.role === "cancel"
        ? { ...entry, command: { ...entry.command, tick: 10 } } : entry) }, true).failures)
      .toContain("queue_boundary_pending_request_missing");
  });

  for (const phase of ["callback", "started"] as const) {
    test(`requires the actual ${phase} sample around each payment`, () => {
      const world = multiplayerQueueBoundaryFixture();
      if (!world.capture) throw new Error("synthetic_capture_missing");
      expect(normalizeMultiplayerQueueBoundary({ ...world, capture: { ...world.capture,
        facts: world.capture.facts.filter((fact) => fact.kind !== "queue_resource" || fact.resource.emission.phase !== phase)
      } }, true).failures).toContain("queue_boundary_scoped_payment_invalid");
    });
  }

  test("fails closed on truncation, absent physical items and an existing actor masquerading as completion", () => {
    const world = multiplayerQueueBoundaryFixture();
    if (!world.capture) throw new Error("synthetic_capture_missing");
    const altered = { ...world, capture: { ...world.capture, droppedFactCount: 1,
      facts: world.capture.facts.map((fact) => fact.kind === "outcome" && fact.outcome.kind === "completed"
        ? { ...fact, outcome: { ...fact.outcome, worldLinkIds: ["producer"] } } : fact) },
      checkpoints: world.checkpoints.map((entry) => entry.boundary === "rejected"
        ? { ...entry, snapshot: { ...entry.snapshot, queues: [] } } : entry) };
    expect(normalizeMultiplayerQueueBoundary(altered, true).failures).toEqual(expect.arrayContaining([
      "queue_boundary_capture_incomplete", "queue_boundary_physical_item_missing", "queue_boundary_useful_spawn_missing"
    ]));
  });

  test("rejects a claimed refund whose real scoped amount differs from the stored definition", () => {
    const world = multiplayerQueueBoundaryFixture();
    if (!world.capture) throw new Error("synthetic_capture_missing");
    expect(normalizeMultiplayerQueueBoundary({ ...world, capture: { ...world.capture,
      facts: world.capture.facts.map((fact) => fact.kind === "queue_resource" && fact.resource.operation === "cancellation_refund"
        ? { ...fact, resource: { ...fact.resource, emission: { ...fact.resource.emission, requested: { food: 26 } } } } : fact)
    } }, true).failures).toContain("queue_boundary_price_or_refund_invalid");
  });

  test("rejects an outcome from a different authority epoch even when its command ID matches", () => {
    const world = multiplayerQueueBoundaryFixture();
    if (!world.capture) throw new Error("synthetic_capture_missing");
    expect(normalizeMultiplayerQueueBoundary({ ...world, capture: { ...world.capture,
      facts: world.capture.facts.map((fact) => fact.kind === "outcome" && fact.outcome.commandId === "probe"
        ? { ...fact, outcome: { ...fact.outcome, authorityEpoch: 1 } } : fact)
    } }, true).failures).toContain("queue_boundary_outcome_lineage_invalid");
  });
});
