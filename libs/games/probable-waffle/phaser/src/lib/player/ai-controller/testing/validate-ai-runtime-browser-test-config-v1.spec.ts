import { isAiRuntimeBrowserTestConfigV1 } from "./validate-ai-runtime-browser-test-config-v1";

const neutralSource = {
  fixtureActorId: "neutral-forest",
  actorName: "Tree1",
  owner: null,
  position: { x: 320, y: 640, z: 0 }
};

const config = {
  schemaVersion: 1,
  enabled: true,
  seed: 81501,
  startPaused: true,
  presetWorld: {
    fixtureId: "neutral-resource-service",
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    actors: [neutralSource],
    resourceGrants: []
  }
};

describe("runtime preset neutral source validation", () => {
  it("accepts an explicitly neutral fixture actor for authoritative application", () => {
    expect(isAiRuntimeBrowserTestConfigV1(config)).toBe(true);
  });

  it("rejects invalid pseudo-owners and queues assigned to a neutral actor", () => {
    expect(isAiRuntimeBrowserTestConfigV1({
      ...config,
      presetWorld: { ...config.presetWorld, actors: [{ ...neutralSource, owner: 0 }] }
    })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({
      ...config,
      presetWorld: {
        ...config.presetWorld,
        queues: [{ producerFixtureActorId: "neutral-forest", actorName: "TivaraWorkerMale", count: 1 }]
      }
    })).toBe(false);
  });

  it("accepts only unique owned workers assigned to authored neutral gathering sources", () => {
    const worker = {
      fixtureActorId: "owned-worker", actorName: "TivaraWorkerMale", owner: 2,
      position: { x: 352, y: 640, z: 0 }
    };
    const withWorker = {
      ...config,
      presetWorld: {
        ...config.presetWorld,
        actors: [neutralSource, worker],
        initialOrders: [
          { workerFixtureActorId: "owned-worker", sourceFixtureActorId: "neutral-forest", kind: "gather" }
        ]
      }
    };
    expect(isAiRuntimeBrowserTestConfigV1(withWorker)).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({
      ...withWorker,
      presetWorld: {
        ...withWorker.presetWorld,
        initialOrders: [...withWorker.presetWorld.initialOrders, ...withWorker.presetWorld.initialOrders]
      }
    })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({
      ...withWorker,
      presetWorld: {
        ...withWorker.presetWorld,
        initialOrders: [{ ...withWorker.presetWorld.initialOrders[0], sourceFixtureActorId: "missing" }]
      }
    })).toBe(false);
  });

  it("accepts exact zero-resource starts and rejects duplicate or invalid balances", () => {
    const withStart = {
      ...config,
      presetWorld: { ...config.presetWorld, resourceStarts: [
        { playerNumber: 2, amounts: { wood: 0, food: 900 } }
      ] }
    };
    expect(isAiRuntimeBrowserTestConfigV1(withStart)).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({
      ...withStart,
      presetWorld: {
        ...withStart.presetWorld,
        resourceStarts: [...withStart.presetWorld.resourceStarts, ...withStart.presetWorld.resourceStarts]
      }
    })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({
      ...withStart,
      presetWorld: { ...withStart.presetWorld, resourceStarts: [{ playerNumber: 2, amounts: { wood: -1 } }] }
    })).toBe(false);
  });
});
