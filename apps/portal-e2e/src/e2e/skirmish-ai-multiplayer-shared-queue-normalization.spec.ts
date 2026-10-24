import { expect, test } from "@playwright/test";
import { multiplayerSharedQueueFixture } from "./skirmish-ai-multiplayer-shared-queue-fixture";
import { normalizeMultiplayerSharedQueueWorld } from "./skirmish-ai-multiplayer-shared-queue-normalization";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

test.describe("shared queue synthetic contract tests (no runtime or legal-world proof)", () => {
  for (const branch of ["shared_contention", "cancel_research"] as const) {
    test(`normalizes ordered scoped authority shape for ${branch}, preserving all wider gaps`, () => {
      const proof = normalizeMultiplayerSharedQueueWorld(multiplayerSharedQueueFixture(branch), true);
      expect(proof.failures).toEqual([]);
      expect(proof.gaps).toContain("navigation_placement_authority");
      expect(proof).not.toHaveProperty("productionEvidence");
    });
    test(`rejects a missing callback and truncated capture for ${branch}`, () => {
      const world = multiplayerSharedQueueFixture(branch);
      if (!world.capture) throw new Error("synthetic_capture_missing");
      expect(normalizeMultiplayerSharedQueueWorld({ ...world, capture: { ...world.capture,
        facts: world.capture.facts.filter((fact) => fact.kind !== "queue_resource" || fact.resource.emission.phase !== "callback")
      } }, true).failures).toContain("scoped_queue_payment_lineage_invalid");
      expect(normalizeMultiplayerSharedQueueWorld({ ...world, capture: { ...world.capture, droppedFactCount: 1 } }, true)
        .failures).toContain("shared_queue_capture_incomplete");
    });
    test(`cannot replace item-scoped payments with generic cash for ${branch}`, () => {
      const world = multiplayerSharedQueueFixture(branch);
      if (!world.capture) throw new Error("synthetic_capture_missing");
      expect(normalizeMultiplayerSharedQueueWorld({ ...world, capture: { ...world.capture,
        facts: world.capture.facts.map((fact) => fact.kind !== "queue_resource" ? fact : {
          sequence: fact.sequence, tick: fact.tick, playerNumber: fact.playerNumber, kind: "resources_applied",
          action: "resource.removed", amounts: { food: 50 }, before: { food: 75, wood: 0, stone: 0, minerals: 0 },
          after: { food: 25, wood: 0, stone: 0, minerals: 0 }, balanceMatches: true
        } satisfies AiRuntimeProductionFactV1)
      } }, true).failures).toContain(branch === "shared_contention"
        ? "shared_queue_contention_missing" : "research_cancellation_command_cycle_invalid");
    });
  }
  test("rejects separate lanes masquerading as train/research contention", () => {
    const world = multiplayerSharedQueueFixture("shared_contention");
    expect(normalizeMultiplayerSharedQueueWorld({ ...world, checkpoints: world.checkpoints.map((entry) =>
      entry.boundary !== "contending" ? entry : { ...entry, snapshot: { ...entry.snapshot,
        queues: entry.snapshot.queues.map((queue) => ({ ...queue, lanes: queue.lanes.flatMap((lane) =>
          lane.items.map((item, index) => ({ ...lane, laneId: `producer:lane:${index}`, items: [item] }))) }))
      } }) }, true).failures).toContain("shared_queue_physical_boundary_missing");
  });
  test("requires actual new actor variants and completed tech through the stability boundary", () => {
    const world = multiplayerSharedQueueFixture("shared_contention");
    const proof = normalizeMultiplayerSharedQueueWorld({ ...world, checkpoints: world.checkpoints.map((entry) =>
      entry.boundary !== "stable" ? entry : { ...entry, snapshot: { ...entry.snapshot, ownedActors: [], completedResearch: [] } }) }, true);
    expect(proof.failures).toContain("shared_queue_new_actor_missing");
    expect(proof.failures).toContain("shared_queue_research_authority_missing");
  });
  test("requires a real sender request and never fabricates one for a remote observer", () => {
    const world = multiplayerSharedQueueFixture("cancel_research");
    expect(normalizeMultiplayerSharedQueueWorld({ ...world, requests: [] }, true).failures)
      .toContain("research_cancellation_buffered_request_missing");
    expect(normalizeMultiplayerSharedQueueWorld({ ...world, requests: [] }, false).failures).toEqual([]);
    expect(normalizeMultiplayerSharedQueueWorld(world, false).failures).toContain("research_cancellation_remote_request_invented");
  });
  test("rejects an inflated refund, wrong command epoch and a same-product cancellation/requeue cycle", () => {
    const world = multiplayerSharedQueueFixture("cancel_research");
    if (!world.setup || !world.capture) throw new Error("synthetic_capture_missing");
    expect(normalizeMultiplayerSharedQueueWorld({ ...world, setup: { ...world.setup,
      replacement: { ...world.setup.replacement, type: world.setup.research.type }
    } }, true).failures).toContain("research_cancellation_command_cycle_invalid");
    expect(normalizeMultiplayerSharedQueueWorld({ ...world, capture: { ...world.capture,
      facts: world.capture.facts.map((fact) => fact.kind === "queue_resource" && fact.resource.operation === "cancellation_refund"
        ? { ...fact, resource: { ...fact.resource, remainingTimeMs: 5000 } } : fact)
    } }, true).failures).toContain("research_cancellation_pre_credit_or_refund_invalid");
    expect(normalizeMultiplayerSharedQueueWorld({ ...world, capture: { ...world.capture,
      facts: world.capture.facts.map((fact) => fact.kind === "outcome" && fact.outcome.commandId === "probe"
        ? { ...fact, outcome: { ...fact.outcome, authorityEpoch: 1 } } : fact)
    } }, true).failures).toContain("shared_queue_outcome_lineage_invalid");
  });
});
