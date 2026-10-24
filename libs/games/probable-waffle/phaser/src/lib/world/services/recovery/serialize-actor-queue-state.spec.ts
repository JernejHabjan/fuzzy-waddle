import { ObjectNames, ResearchType, type SharedQueueSnapshotData } from "@fuzzy-waddle/probable-waffle-protocol";
import { snapshotSharedQueues, restoreSharedQueues } from "../../../entity/components/queue/shared-queue-snapshot";
import { serializeActorQueueState } from "./serialize-actor-queue-state";
import { digestAuthoritativeStateProjectionV1 } from "./authoritative-state-projection";

function snapshot(): SharedQueueSnapshotData {
  return {
    schemaVersion: 1,
    queues: [[{
      type: "Production", totalTime: 1000, remainingTime: 400,
      productionData: {
        actorName: ObjectNames.TivaraWorker,
        costData: { costType: 0, productionTime: 1000, resources: { food: 37, wood: 2 }, refundFactor: 0.5 }
      },
      commandContext: {
        playerNumber: 2, actorIds: ["producer"],
        execution: {
          schemaVersion: 1, commandId: "purchase", commitmentKey: "worker", source: "ai",
          authorityEpoch: 4, sequence: 17, intentId: "train", effectId: "worker-effect"
        }
      }
    }, {
      type: "Research", researchData: ResearchType.SnowstormSpell, totalTime: 500, remainingTime: 500,
      researchCost: { resources: { minerals: 13 }, refundFactor: 0.25 }
    }], []]
  };
}

function peerHash(sharedQueue: SharedQueueSnapshotData): string {
  return digestAuthoritativeStateProjectionV1({
    schemaVersion: 1, actors: [{ actorId: "producer", digest: serializeActorQueueState({ sharedQueue }) }],
    players: [], research: [], campaignMission: "", campaignMissionFamilies: {}, random: "", systems: {}
  });
}

function queueItem(data: SharedQueueSnapshotData, lane = 0, index = 0) {
  const item = data.queues[lane]?.[index];
  if (!item) throw new Error("missing authored queue item");
  return item;
}

describe("authoritative mixed-queue continuation hash", () => {
  it("retains exact mixed work and empty lanes through the actual save/restore queue codec", () => {
    const before = snapshot();
    const restored = snapshotSharedQueues(restoreSharedQueues(before, 2, 5));
    expect(restored).toEqual(before);
    expect(peerHash(restored)).toBe(peerHash(before));
    const detached = structuredClone(before);
    detached.queues.reverse();
    expect(peerHash(detached)).not.toBe(peerHash(before));
    expect(before.queues[0]).toHaveLength(2);
  });

  it("distinguishes original price, refund policy, mixed order, exact progress and every command identity", () => {
    const before = snapshot();
    const mutations: ((copy: SharedQueueSnapshotData) => void)[] = [
      (copy) => { copy.queues[0]?.reverse(); },
      (copy) => { queueItem(copy).remainingTime -= 0.25; },
      (copy) => { queueItem(copy).totalTime += 1; },
      (copy) => {
        const item = queueItem(copy);
        if (item.type === "Production") item.productionData.costData.resources.food = 38;
      },
      (copy) => {
        const item = queueItem(copy);
        if (item.type === "Production") item.productionData.costData.refundFactor = 0.75;
      },
      (copy) => {
        const item = queueItem(copy, 0, 1);
        if (item.type === "Research") item.researchCost = { resources: { minerals: 14 }, refundFactor: 0.25 };
      }
    ];
    for (const mutate of mutations) {
      const copy = structuredClone(before);
      mutate(copy);
      expect(peerHash(copy)).not.toBe(peerHash(before));
    }
    for (const execution of [
      { commandId: "other" }, { authorityEpoch: 5 }, { sequence: 18 }, { effectId: "other-effect" },
      { commitmentKey: "other-purpose" }, { intentId: "other-intent" }, { source: "human" as const }
    ]) {
      const copy = structuredClone(before);
      const item = queueItem(copy);
      const context = item.commandContext;
      if (!context) throw new Error("missing authored command context");
      item.commandContext = { ...context, execution: { ...context.execution, ...execution } };
      expect(peerHash(copy)).not.toBe(peerHash(before));
    }
  });

  it("canonicalizes object insertion order without sorting lanes or items", () => {
    const before = snapshot();
    const copy = structuredClone(before);
    const item = queueItem(copy);
    if (item.type !== "Production") throw new Error("missing authored production item");
    item.productionData.costData.resources = { wood: 2, food: 37 };
    expect(peerHash(copy)).toBe(peerHash(before));
  });

  it("keeps legacy saves compatible but lets an explicit empty shared snapshot supersede stale legacy lists", () => {
    const legacy = { production: { queue: [{ name: ObjectNames.TivaraWorker, remainingTime: 10 }] } };
    expect(serializeActorQueueState(legacy)).toBe(`${ObjectNames.TivaraWorker}:10;`);
    expect(serializeActorQueueState({ ...legacy, sharedQueue: { schemaVersion: 1, queues: [[]] } }))
      .toBe(serializeActorQueueState({ sharedQueue: { schemaVersion: 1, queues: [[]] } }));
    const invalid = snapshot();
    queueItem(invalid).remainingTime = Number.NaN;
    expect(() => serializeActorQueueState({ sharedQueue: invalid })).toThrow("Non-finite authoritative queue state");
  });
});
