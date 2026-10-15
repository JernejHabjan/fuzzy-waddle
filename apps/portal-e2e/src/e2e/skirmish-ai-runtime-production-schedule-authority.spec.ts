import { expect, test } from "@playwright/test";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import { productionAuthorityFixture } from "./skirmish-ai-runtime-production-authority-fixture";
import { productionConsumedDecisionFixture } from "./skirmish-ai-runtime-production-consumed-decision-fixture";
import { productionContract, productionEvent } from "./skirmish-ai-runtime-production-contract-fixtures";
import { evaluateRuntimeProductionSchedule } from "./skirmish-ai-runtime-production-schedule-evaluation";

/** Pure ownership control: no native world or strategic match is certified by these invented records. */
function abandoned() {
  const { evidence } = productionAuthorityFixture();
  const first = evidence.decisions[0];
  if (!first) throw new Error("synthetic_decision_missing");
  const second = productionConsumedDecisionFixture(40, 2, 1);
  const transition = {
    planId: "plan:future",
    demandId: "demand:future",
    targetActorId: "enemy",
    domain: "ground",
    producerObjectName: ObjectNames.AnkGuard,
    productObjectName: ObjectNames.TivaraMacemanMale,
    status: "committed",
    committedTick: 20,
    beginsTick: 200,
    forceDeadlineTick: 400,
    desiredForce: 4,
    desiredProducers: 2,
    unitDurationTicks: 100,
    reason: "visible_pressure"
  } as const;
  const result = {
    ...evidence,
    decisions: [
      {
        ...first,
        result: {
          ...first.result,
          reservations: [
            {
              claimId: "claim:forecast",
              ownerPlanId: transition.planId,
              subjectKey: "resource:wood",
              createdTick: 20,
              prerequisites: [],
              state: { kind: "forecast" }
            }
          ],
          economyProduction: { ...first.result.economyProduction, transition }
        }
      },
      {
        inputTick: 40,
        inputGeneration: second.selected.decision.identity.generation,
        selectedTick: 40,
        selectedSequence: 20,
        result: {
          ...second.selected.decision,
          economyProduction: {
            ...second.selected.decision.economyProduction,
            transition: { ...transition, status: "abandoned", reason: "objective_changed" }
          }
        }
      }
    ],
    coverage: {
      ...evidence.coverage,
      intervals: evidence.coverage.intervals.map((interval) => ({
        ...interval,
        actors: [
          {
            identity: {
              actorId: "producer",
              objectName: ObjectNames.AnkGuard,
              canonicalObjectName: ObjectNames.AnkGuard,
              playerNumber: 1,
              active: true,
              alive: true,
              finished: true,
              indexed: true
            },
            position: { x: 4, y: 5, z: 0 },
            level: 1
          }
        ],
        queues: [
          {
            actorId: "producer",
            objectName: ObjectNames.AnkGuard,
            lanes: [{ laneId: "lane", capacity: 2, itemIds: [] }]
          }
        ]
      }))
    }
  } satisfies RuntimeProductionEvidenceV2;
  return result;
}

test("same-tick unfinished prebuild is not ready initial throughput; busy or duplicate ready capacity still fails", () => {
  const evidence = abandoned();
  const contract = productionContract("PRO-03", "future_abandoned");
  const withSite = (finished: boolean, busy: boolean) => ({
    ...evidence,
    coverage: {
      ...evidence.coverage,
      intervals: evidence.coverage.intervals.map((interval) => {
        const actor = interval.actors[0],
          queue = interval.queues[0];
        if (!actor || !queue) throw new Error("synthetic_producer_missing");
        return {
          ...interval,
          actors: [...interval.actors, { ...actor, identity: { ...actor.identity, actorId: "new-site", finished } }],
          queues: [
            { ...queue, lanes: queue.lanes.map((lane) => ({ ...lane, itemIds: busy ? ["active-work"] : [] })) },
            { ...queue, actorId: "new-site" }
          ]
        };
      })
    }
  });
  expect(evaluateRuntimeProductionSchedule(contract, withSite(false, false))).toEqual([]);
  expect(evaluateRuntimeProductionSchedule(contract, withSite(true, false))).toContain(
    "production_v2_transition_idle_capacity_missing"
  );
  expect(evaluateRuntimeProductionSchedule(contract, withSite(false, true))).toContain(
    "production_v2_transition_idle_capacity_missing"
  );
});

test("abandonment releases forecasts while preserving already admitted work through a native-shaped terminal", () => {
  const evidence = abandoned();
  const contract = productionContract("PRO-03", "future_abandoned");
  expect(evaluateRuntimeProductionSchedule(contract, evidence)).toEqual([]);
  const enqueue = {
    ...productionEvent(10, 30, "enqueue", { itemId: "paid", planId: "plan:future" }),
    applicationTick: 30,
    selectedSequence: 1
  };
  const complete = {
    ...productionEvent(30, 100, "complete", { itemId: "paid", planId: "plan:future" }),
    applicationTick: 100,
    selectedSequence: 1,
    commandId: enqueue.commandId,
    effectId: enqueue.effectId
  };
  const paid = { ...evidence, lifecycle: { ...evidence.lifecycle, queues: [enqueue, complete] } };
  expect(evaluateRuntimeProductionSchedule(contract, paid)).toEqual([]);
  expect(
    evaluateRuntimeProductionSchedule(contract, { ...paid, lifecycle: { ...paid.lifecycle, queues: [enqueue] } })
  ).toContain("production_v2_abandoned_paid_queue_vanished");
  const selected = evidence.decisions[0];
  if (!selected) throw new Error("synthetic_claim_missing");
  expect(
    evaluateRuntimeProductionSchedule(contract, {
      ...evidence,
      decisions: evidence.decisions.map((entry, index) =>
        index === 1 ? { ...entry, result: { ...entry.result, reservations: selected.result.reservations } } : entry
      )
    })
  ).toContain("production_v2_forecast_not_released");
  for (const originalKind of ["forecast", "provisional"] as const) {
    const claims = selected.result.reservations.map((claim) => ({
      ...claim,
      state:
        originalKind === "provisional"
          ? {
              kind: "provisional" as const,
              expiresAt: { clock: "simulation", unit: "tick", dueTick: 100, persistence: "save" } as const
            }
          : { kind: "forecast" as const }
    }));
    const forged = evidence.decisions.map((entry, index) => ({
      ...entry,
      result: {
        ...entry.result,
        reservations:
          index === 0
            ? claims
            : claims.map((claim) => ({ ...claim, state: { kind: "applied_spending" as const, appliedTick: 30 } }))
      }
    }));
    expect(evaluateRuntimeProductionSchedule(contract, { ...evidence, decisions: forged })).toContain(
      "production_v2_forecast_not_released"
    );
  }
});

test("H-17 cannot certify vanished demand without a completed retained producer", () => {
  const evidence = abandoned();
  expect(evaluateRuntimeProductionSchedule(productionContract("H-17", "future_abandoned"), evidence)).toContain(
    "production_v2_abandoned_finished_producer_missing"
  );
});
