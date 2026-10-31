import { expect, test } from "@playwright/test";
import { evaluateRuntimeSupplyRecovery } from "./skirmish-ai-runtime-supply-evaluation";
import { productionAuthorityFixture } from "./skirmish-ai-runtime-production-authority-fixture";
import { productionWorldFixture } from "./skirmish-ai-runtime-production-world-fixture";
import { productionEvent } from "./skirmish-ai-runtime-production-contract-fixtures";
import { productionCheckpoint } from "./skirmish-ai-runtime-digest-fixtures";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

const requirement = { lossEventId: "loss", housingObjectName: "Olival", latestTick: 600, paidQueueCount: 1 };

function fixture() {
  const { evidence } = productionAuthorityFixture();
  const { setup } = productionWorldFixture();
  const item = setup.initialQueueItems[0];
  if (!item?.objectName) throw new Error("seeded_queue_fixture_missing");
  const productName = item.objectName;
  return {
    supplyBranch: "prebuild" as const,
    presetInitialQueueItems: [item],
    perturbations: [{ id: "loss", tick: 200, dispatchedActors: 1, subjectName: "Olival", affectedActorId: "old" }],
    checkpoints: [
      {
        ...productionCheckpoint(20, item.itemId),
        ownedConstruction: [{ actorId: "old", objectName: "Olival", progress: 100 }]
      },
      {
        ...productionCheckpoint(600, item.itemId),
        ownedConstruction: [{ actorId: "new", objectName: "Olival", progress: 100 }],
        militaryActors: [{ actorId: "output", objectName: productName }]
      }
    ],
    productionEvidenceV2: {
      ...evidence,
      lifecycle: {
        ...evidence.lifecycle,
        setupPayments: setup.queueApplications,
        queues: [
          {
            ...productionEvent(3, 500, "complete", {
              itemId: item.itemId,
              actorId: item.producerActorId,
              productKey: productName,
              createdActorId: "output"
            }),
            applicationTick: 500,
            selectedSequence: null
          }
        ]
      }
    }
  };
}

test("supply recovery requires paid matched output and exactly one physical replacement", () => {
  const variant = fixture();
  expect(evaluateRuntimeSupplyRecovery(requirement, variant)).toEqual([]);
  expect(
    evaluateRuntimeSupplyRecovery(requirement, { ...variant, checkpoints: variant.checkpoints.slice(0, 1) })
  ).toEqual(expect.arrayContaining(["supply_recovery_paid_output_lost", "supply_recovery_replacement_not_once"]));
  expect(evaluateRuntimeSupplyRecovery(requirement, { ...variant, perturbations: [] })).toEqual([
    "supply_recovery_loss_missing"
  ]);
});

test("supply recovery fails missing history, missing payment, wrong producer and duplicate completion", () => {
  const variant = fixture();
  expect(evaluateRuntimeSupplyRecovery(requirement, { ...variant, productionEvidenceV2: undefined })).toEqual([
    "supply_recovery_history_missing"
  ]);
  const evidence = variant.productionEvidenceV2;
  expect(
    evaluateRuntimeSupplyRecovery(requirement, {
      ...variant,
      productionEvidenceV2: {
        ...evidence,
        lifecycle: { ...evidence.lifecycle, setupPayments: [] }
      }
    })
  ).toContain("supply_recovery_paid_setup_missing");
  for (const queues of [
    evidence.lifecycle.queues.map((event) => ({ ...event, actorId: "wrong" })),
    [...evidence.lifecycle.queues, ...evidence.lifecycle.queues],
    evidence.lifecycle.queues.map((event) => ({ ...event, kind: "cancel" as const }))
  ]) {
    expect(
      evaluateRuntimeSupplyRecovery(requirement, {
        ...variant,
        productionEvidenceV2: {
          ...evidence,
          lifecycle: { ...evidence.lifecycle, queues }
        }
      })
    ).toContain("supply_recovery_paid_output_lost");
  }
});

test("seeded controller outputs use raw native completion without an AI-selected effect", () => {
  const variant = fixture();
  const item = variant.presetInitialQueueItems[0];
  if (!item?.objectName) throw new Error("seeded_queue_fixture_missing");
  const { raw } = productionAuthorityFixture();
  const fact: Extract<AiRuntimeProductionFactV1, { kind: "queue_completion" }> = {
    sequence: 20,
    tick: 500,
    playerNumber: 1,
    kind: "queue_completion",
    completion: {
      completionId: 1,
      phase: "after",
      actorId: item.producerActorId,
      item: {
        itemId: item.itemId,
        identitySource: "command",
        commandId: "setup",
        effectId: null,
        objectName: item.objectName,
        researchType: null,
        totalTimeMs: 5000,
        remainingTimeMs: 0,
        payment: "immediate",
        charge: { food: 100 }
      },
      originatingCommandContext: null,
      requestedCanonicalObjectName: item.objectName,
      createdActor: {
        actorId: "output",
        objectName: item.objectName,
        canonicalObjectName: item.objectName,
        playerNumber: 1,
        active: true,
        alive: true,
        finished: true,
        indexed: true
      },
      createdActorInProducerScene: true,
      researchRegistered: null,
      snapshotRestoreInProgress: false,
      gaps: []
    }
  };
  const native = {
    ...variant,
    productionCapture: { ...raw.capture, facts: [fact] },
    productionEvidenceV2: {
      ...variant.productionEvidenceV2,
      lifecycle: { ...variant.productionEvidenceV2.lifecycle, queues: [] }
    }
  };
  expect(evaluateRuntimeSupplyRecovery(requirement, native)).toEqual([]);
  expect(
    evaluateRuntimeSupplyRecovery(requirement, {
      ...native,
      productionCapture: {
        ...raw.capture,
        facts: [
          fact,
          {
            sequence: 21,
            tick: 501,
            playerNumber: 1,
            kind: "queue_mutation",
            mutation: {
              mutationId: 1,
              phase: "after",
              operation: "cancel_remove",
              actorId: item.producerActorId,
              laneId: "producer:lane:0",
              itemIndex: 0,
              item: fact.completion.item,
              originatingCommandContext: null,
              cancellationCommand: null,
              snapshotRestoreInProgress: false,
              gaps: []
            }
          }
        ]
      }
    })
  ).toContain("supply_recovery_paid_output_lost");
  for (const completion of [
    { ...fact.completion, actorId: "wrong" },
    { ...fact.completion, createdActorInProducerScene: false },
    { ...fact.completion, snapshotRestoreInProgress: true }
  ]) {
    expect(
      evaluateRuntimeSupplyRecovery(requirement, {
        ...native,
        productionCapture: { ...raw.capture, facts: [{ ...fact, completion }] }
      })
    ).toContain("supply_recovery_paid_output_lost");
  }
});
