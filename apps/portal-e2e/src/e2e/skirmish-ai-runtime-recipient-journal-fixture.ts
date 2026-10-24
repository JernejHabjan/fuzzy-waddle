import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Synthetic journal records only. Full alias/lifetime authority remains unsupported regardless of fixture gaps. */
export function recipientJournalFixture() {
  const zero = { wood: 0, food: 0, stone: 0, minerals: 0 }, after = { ...zero, wood: 7 };
  const read = { captureEpoch: 1, lossEpoch: 0, sequence: 2, playerNumber: 1, generation: 7 };
  const resources = Object.values(ResourceType).map((resourceType) => ({ resourceType, stockpile: 0,
    reservedUnspent: 0, obligationsDue: 0,
    deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 0 } }));
  const common = { tick: 0, playerNumber: 1 };
  const mutation = { operationId: 1, action: "add" as const, entrySequence: 3, requested: { wood: 7 },
    before: zero, bindingValid: true, lossEpoch: 0 };
  const facts: AiRuntimeProductionFactV1[] = [
    { ...common, sequence: 1, kind: "recipient_resources_installed", resources: zero },
    { ...common, sequence: 2, kind: "resource_input_read", read, resources },
    { ...common, sequence: 3, kind: "recipient_resource_mutation", mutation: { ...mutation, phase: "before", after: null } },
    { ...common, sequence: 4, kind: "recipient_resource_mutation", mutation: { ...mutation, phase: "returned", after } }
  ];
  const capture = { schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 1,
    droppedFactCount: 0, droppedSnapshotCount: 0, gaps: [], snapshots: [], facts, recipientResourceFacts: facts,
    resourceCoverage: { captureEpoch: 1, lossEpoch: 0, startedTick: 0, frontier: { tick: 0, captureSequence: 4 },
      lost: false, losses: [], cohorts: [], gaps: [] }
  } satisfies AiRuntimeProductionCaptureV1;
  return { capture, read, resources, zero, after };
}
