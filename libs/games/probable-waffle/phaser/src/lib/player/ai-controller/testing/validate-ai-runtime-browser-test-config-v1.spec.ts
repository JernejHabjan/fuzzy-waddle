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
});
