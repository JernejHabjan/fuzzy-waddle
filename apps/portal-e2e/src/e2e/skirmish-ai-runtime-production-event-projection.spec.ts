import { expect, test } from "@playwright/test";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { projectRuntimeProductionEnqueues } from "./skirmish-ai-runtime-production-event-projection";

test("joins actual-shaped immediate money with physical insertion and excludes only its own selected claim", () => {
  const raw = productionQueueMutationFixture("immediate");
  const result = normalizeRuntimeProductionCausality(raw);
  expect(result.failures).toEqual([]);
  expect(result.enqueues).toHaveLength(1);
  expect(result.enqueues?.[0]).toMatchObject({
    kind: "enqueue",
    commandId: "purchase",
    resourcesBefore: { food: 100 },
    resourcesAfter: { food: 93 },
    charged: { food: 7 },
    reservedUnspent: { food: 0 },
    obligationsDue: { food: 11 },
    obligationsAfter: { food: 11 }
  });
  expect(result).not.toHaveProperty("productionEvidence");
  expect(result.gaps).toContain("production_ai_event_liabilities_missing");
});

test("per-tick admission records future obligations without an immediate charge or predicted refund", () => {
  const result = normalizeRuntimeProductionCausality(productionQueueMutationFixture());
  expect(result.failures).toEqual([]);
  expect(result.enqueues?.[0]).toMatchObject({
    resourcesBefore: { food: 100 },
    resourcesAfter: { food: 100 },
    charged: { food: 0 },
    reservedUnspent: { food: 0 },
    obligationsDue: { food: 11 },
    obligationsAfter: { food: 32 },
    remainingSuccessfulTicks: 3,
    refundForItemId: null,
    refundAmounts: { food: 0 }
  });
});

test("missing charge, unspent ownership or native identity never become zero-valued event proof", () => {
  const raw = productionQueueMutationFixture("immediate");
  const result = normalizeRuntimeProductionCausality(raw);
  const missing = projectRuntimeProductionEnqueues(raw, result.queueMutations, [], result.commands);
  expect(missing.events).toEqual([]);
  expect(missing.gaps).toContain("production_ai_enqueue_event_authority_missing");
  const partial = result.queueMutations.map((mutation) => ({ ...mutation, reservedUnspentAfter: null }));
  expect(projectRuntimeProductionEnqueues(raw, partial, result.operations, result.commands).events).toEqual([]);
  const wrong = result.operations.map((operation) => ({ ...operation, itemId: "other-item" }));
  expect(projectRuntimeProductionEnqueues(raw, result.queueMutations, wrong, result.commands).failures).toContain(
    "production_ai_enqueue_event_charge_mismatch"
  );
});

test("overflow remains a failure instead of presenting a selected subset as complete", () => {
  const raw = productionQueueMutationFixture();
  const result = normalizeRuntimeProductionCausality(raw);
  expect(
    projectRuntimeProductionEnqueues(
      { ...raw, droppedFactCount: 1 },
      result.queueMutations,
      result.operations,
      result.commands
    )
  ).toMatchObject({ events: [], failures: ["production_ai_enqueue_event_capture_dropped"] });
});
