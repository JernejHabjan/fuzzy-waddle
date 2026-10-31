import type Phaser from "phaser";
import {
  AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
  clearAiRuntimeBrowserTestHostV1,
  publishAiRuntimeBrowserTestHostV1,
  readAiRuntimeBrowserTestConfigV1
} from "./ai-runtime-browser-test-host";

describe("AI runtime browser test host", () => {
  afterEach(() => {
    window.sessionStorage.removeItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1);
    delete window.__fuzzyWaddleAiRuntimeBrowserTestV1;
  });

  it("requires a complete explicit deterministic test configuration", () => {
    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: 759008, startPaused: true })
    );

    expect(readAiRuntimeBrowserTestConfigV1()).toEqual({
      schemaVersion: 1,
      enabled: true,
      seed: 759008,
      startPaused: true
    });

    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: -1, startPaused: true })
    );
    expect(readAiRuntimeBrowserTestConfigV1()).toBeNull();

    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: 759008 })
    );
    expect(readAiRuntimeBrowserTestConfigV1()).toBeNull();
  });

  it("fails closed for malformed preset actors, provenance, resources, and zero-work setups", () => {
    const valid = {
      schemaVersion: 1,
      enabled: true,
      seed: 826001,
      startPaused: true,
      presetWorld: {
        fixtureId: "focused-defense",
        provenance: {
          sourceRevision: "a".repeat(40),
          fixtureDigest: "fnv1a32:1234abcd"
        },
        actors: [
          {
            fixtureActorId: "ai-guard-1",
            actorName: "TivaraMacemanMale",
            owner: 2,
            position: { x: 448, y: 848, z: 0 }
          }
        ],
        resourceGrants: [{ playerNumber: 2, amounts: { food: 500 } }]
      }
    } as const;
    window.sessionStorage.setItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1, JSON.stringify(valid));
    expect(readAiRuntimeBrowserTestConfigV1()).toEqual(valid);

    for (const presetWorld of [
      { ...valid.presetWorld, actors: [{ ...valid.presetWorld.actors[0], actorName: "FakeSuccessUnit" }] },
      { ...valid.presetWorld, provenance: { ...valid.presetWorld.provenance, sourceRevision: "working-tree" } },
      { ...valid.presetWorld, resourceGrants: [{ playerNumber: 2, amounts: { gold: 500 } }] },
      { ...valid.presetWorld, queues: [{ producerFixtureActorId: "missing", actorName: "TivaraSlingshotFemale", count: 1 }] },
      { ...valid.presetWorld, queues: [{ producerFixtureActorId: "ai-guard-1", actorName: "FakeUnit", count: 1 }] },
      { ...valid.presetWorld, events: [{ id: "loss", tick: 0, kind: "destroy_owned_actor", owner: 2, objectName: "AnkGuard" }] },
      { ...valid.presetWorld, events: [{ id: "loss", tick: 500, kind: "force_ai_success", owner: 2, objectName: "AnkGuard" }] },
      { ...valid.presetWorld, events: [{ id: "loss", tick: 500, kind: "destroy_owned_actor", owner: 2, objectName: "FakeProducer" }] },
      { ...valid.presetWorld, actors: [], resourceGrants: [] }
    ]) {
      window.sessionStorage.setItem(
        AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
        JSON.stringify({ ...valid, presetWorld })
      );
      expect(readAiRuntimeBrowserTestConfigV1()).toBeNull();
    }
  });

  it("clears only the game instance which owns the published handle", () => {
    const first = {} as Phaser.Game;
    const replacement = {} as Phaser.Game;
    const config = { schemaVersion: 1, enabled: true, seed: 759008, startPaused: true } as const;

    publishAiRuntimeBrowserTestHostV1(first, config);
    clearAiRuntimeBrowserTestHostV1(replacement);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1?.game).toBe(first);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1?.initialStateByPlayer).toEqual({});

    clearAiRuntimeBrowserTestHostV1(first);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toBeUndefined();
  });
});
