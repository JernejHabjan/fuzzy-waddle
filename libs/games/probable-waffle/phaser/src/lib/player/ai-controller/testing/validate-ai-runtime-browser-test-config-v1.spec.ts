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
  it("keeps calibration confined to explicit supported native duels without presets or privilege fields", () => {
    const natural = { schemaVersion: 1, enabled: true, seed: 759061, startPaused: true,
      calibration: { targetPlayerNumber: 1, difficulty: "Hard", opponentArchetype: "rush" } };
    expect(isAiRuntimeBrowserTestConfigV1(natural)).toBe(true);
    for (const calibration of [{ ...natural.calibration, targetPlayerNumber: 3 },
      { ...natural.calibration, difficulty: "Impossible" }, { ...natural.calibration, opponentArchetype: "omniscient" },
      { ...natural.calibration, resources: 10000 }])
      expect(isAiRuntimeBrowserTestConfigV1({ ...natural, calibration })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, calibration: natural.calibration })).toBe(false);
  });
  it("requires a separate strict combat marker inside the explicit authority capture", () => {
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureProduction: true, captureCombat: true })).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureCombat: true })).toBe(false);
    for (const captureCombat of [false, "true", 1, null]) {
      expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureProduction: true, captureCombat })).toBe(false);
    }
  });
  it("requires explicit capture for owned placement-route declarations", () => {
    const scoped = { ...config, captureProduction: true, presetWorld: { ...config.presetWorld,
      actors: [{ ...neutralSource, owner: 2 }], protectedRoutes: [{
        id: "worker-service", playerNumber: 2, from: { x: 100, y: 200 }, to: { x: 200, y: 400 }, tileMargin: 1
      }]
    } };
    expect(isAiRuntimeBrowserTestConfigV1(scoped)).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({ ...scoped, captureProduction: undefined })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({ ...scoped, presetWorld: { ...scoped.presetWorld,
      protectedRoutes: scoped.presetWorld.protectedRoutes.map((route) => ({ ...route, playerNumber: 1 }))
    } })).toBe(false);
  });

  it("accepts shared construction roles for pinned cancellation and rejects conflicting starting duties", () => {
    const worker = {
      fixtureActorId: "owned-builder", actorName: "TivaraWorkerMale", owner: 2,
      position: { x: 704, y: 720, z: 0 }
    };
    const construction = {
      fixtureActorId: "unfinished-site", actorName: "AnkGuard", builderFixtureActorIds: ["owned-builder"],
      position: { x: 800, y: 848, z: 0 }
    };
    const event = {
      id: "site-cancel", tick: 100, kind: "cancel_unfinished_site", owner: 2,
      objectName: "AnkGuard", fixtureActorId: "unfinished-site"
    };
    const valid = { ...config, presetWorld: {
      ...config.presetWorld, actors: [neutralSource, worker], constructionOrders: [construction], events: [event]
    } };
    expect(isAiRuntimeBrowserTestConfigV1(valid)).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({ ...valid, presetWorld: {
      ...valid.presetWorld,
      initialOrders: [{ workerFixtureActorId: "owned-builder", sourceFixtureActorId: "neutral-forest", kind: "gather" }]
    } })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({ ...valid, presetWorld: {
      ...valid.presetWorld, events: [{ ...event, fixtureActorId: undefined }]
    } })).toBe(false);
    expect(isAiRuntimeBrowserTestConfigV1({ ...valid, presetWorld: {
      ...valid.presetWorld, events: [{ ...event, owner: 1 }]
    } })).toBe(false);
  });
  it("pins a loss only to an authored actor with the same owner and concrete name", () => {
    const actor = { ...neutralSource, fixtureActorId: "producer", actorName: "AnkGuard", owner: 2 };
    const event = {
      id: "producer-loss",
      tick: 100,
      kind: "destroy_owned_actor",
      owner: 2,
      objectName: "AnkGuard",
      fixtureActorId: "producer"
    };
    const valid = { ...config, presetWorld: { ...config.presetWorld, actors: [actor], events: [event] } };
    expect(isAiRuntimeBrowserTestConfigV1(valid)).toBe(true);
    for (const changed of [
      { fixtureActorId: "missing" },
      { fixtureActorId: null },
      { owner: 1 },
      { objectName: "InfantryInn" }
    ]) {
      expect(
        isAiRuntimeBrowserTestConfigV1({
          ...valid,
          presetWorld: { ...valid.presetWorld, events: [{ ...event, ...changed }] }
        })
      ).toBe(false);
    }
  });
  it("accepts only an explicit strict faction-roster request", () => {
    const presetWorld = { ...config.presetWorld, requireFactionRoster: true };
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, presetWorld })).toBe(true);
    for (const requireFactionRoster of [false, "true", 1, null, {}]) {
      expect(isAiRuntimeBrowserTestConfigV1({ ...config, presetWorld: { ...presetWorld, requireFactionRoster } })).toBe(
        false
      );
    }
  });
  it("accepts only the explicit production capture opt-in", () => {
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureProduction: true })).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureProduction: true, captureMovementOnly: true })).toBe(true);
    expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureMovementOnly: true })).toBe(false);
    for (const captureProduction of [false, "true", 1, {}]) {
      expect(isAiRuntimeBrowserTestConfigV1({ ...config, captureProduction })).toBe(false);
    }
  });

  it("accepts an explicitly neutral fixture actor for authoritative application", () => {
    expect(isAiRuntimeBrowserTestConfigV1(config)).toBe(true);
  });

  it("rejects invalid pseudo-owners and queues assigned to a neutral actor", () => {
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...config,
        presetWorld: { ...config.presetWorld, actors: [{ ...neutralSource, owner: 0 }] }
      })
    ).toBe(false);
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...config,
        presetWorld: {
          ...config.presetWorld,
          queues: [{ producerFixtureActorId: "neutral-forest", actorName: "TivaraWorkerMale", count: 1 }]
        }
      })
    ).toBe(false);
  });

  it("accepts only unique owned workers assigned to authored neutral gathering sources", () => {
    const worker = {
      fixtureActorId: "owned-worker",
      actorName: "TivaraWorkerMale",
      owner: 2,
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
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withWorker,
        presetWorld: {
          ...withWorker.presetWorld,
          initialOrders: [...withWorker.presetWorld.initialOrders, ...withWorker.presetWorld.initialOrders]
        }
      })
    ).toBe(false);
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withWorker,
        presetWorld: {
          ...withWorker.presetWorld,
          initialOrders: [{ ...withWorker.presetWorld.initialOrders[0], sourceFixtureActorId: "missing" }]
        }
      })
    ).toBe(false);
  });

  it("accepts exact zero-resource starts and rejects duplicate or invalid balances", () => {
    const withStart = {
      ...config,
      presetWorld: { ...config.presetWorld, resourceStarts: [{ playerNumber: 2, amounts: { wood: 0, food: 900 } }] }
    };
    expect(isAiRuntimeBrowserTestConfigV1(withStart)).toBe(true);
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withStart,
        presetWorld: {
          ...withStart.presetWorld,
          resourceStarts: [...withStart.presetWorld.resourceStarts, ...withStart.presetWorld.resourceStarts]
        }
      })
    ).toBe(false);
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withStart,
        presetWorld: { ...withStart.presetWorld, resourceStarts: [{ playerNumber: 2, amounts: { wood: -1 } }] }
      })
    ).toBe(false);
  });
});

describe("runtime research seed validation", () => {
  const producer = { ...neutralSource, fixtureActorId: "owned-producer", owner: 2 };
  const research = { producerFixtureActorId: producer.fixtureActorId, researchType: "tivaraMacemanUpgradeLevel2" };
  const withResearch = {
    ...config,
    presetWorld: { ...config.presetWorld, actors: [producer], researchQueues: [research] }
  };

  it("accepts definition-named owned research and rejects unknown fields, types, producers and duplicate player tech", () => {
    expect(isAiRuntimeBrowserTestConfigV1(withResearch)).toBe(true);
    for (const queue of [
      { ...research, researchType: "invented" },
      { ...research, count: 1 },
      { ...research, producerFixtureActorId: "missing" }
    ]) {
      expect(
        isAiRuntimeBrowserTestConfigV1({
          ...withResearch,
          presetWorld: { ...withResearch.presetWorld, researchQueues: [queue] }
        })
      ).toBe(false);
    }
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withResearch,
        presetWorld: { ...withResearch.presetWorld, actors: [{ ...producer, owner: null }] }
      })
    ).toBe(false);
    const second = { ...producer, fixtureActorId: "second-producer" };
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withResearch,
        presetWorld: {
          ...withResearch.presetWorld,
          actors: [producer, second],
          researchQueues: [research, { ...research, producerFixtureActorId: second.fixtureActorId }]
        }
      })
    ).toBe(false);
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...withResearch,
        presetWorld: {
          ...withResearch.presetWorld,
          actors: [producer, { ...second, owner: 1 }],
          researchQueues: [research, { ...research, producerFixtureActorId: second.fixtureActorId }]
        }
      })
    ).toBe(true);
  });
});
