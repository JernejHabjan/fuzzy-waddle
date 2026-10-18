import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

// At 50 ms/tick, 20 s of native work cannot finish by tick 80 even with the maximum four builders from tick zero.
export const CONSTRUCTION_INTERRUPTION_TICK = 80;

/**
 * Concrete native owner controls for unfinished-site bindings, not full PLACE-03 clearance acceptance.
 * The real shared build command creates AnkGuard; the fixture supplies neither site progress nor completion.
 */
export function constructionRecoveryWorld(branch: "builder_loss" | "intact" | "cancel_site"): RuntimeFixtureV1 {
  return {
    schemaVersion: 1, evidenceKind: "runtime", scenarioIds: ["PLACE-03"],
    recipe: {
      mapLabel: "AI Open Economy (test only)", aiPlayerNumber: 2, simulationTimeScale: 1, fixedStepFrames: true,
      checkpointTicks: [20, 60, 79, 80, 100, 120, 180, 240, 400, 800, 1000, 1200],
      variants: [{
        id: `construction-${branch}`, executionKind: "focused_preset", role: "standalone", seed: 759930,
        aiFaction: "Tivara", humanFaction: "Skaduwee", difficulty: "Normal", captureConstruction: true,
        presetWorld: {
          fixtureId: "unfinished-producer-recovery", requireFactionRoster: true,
          actors: [
            { fixtureActorId: "original-builder", actorName: "TivaraWorkerMale", owner: 2,
              position: { x: 704, y: 720, z: 0 } },
            { fixtureActorId: "replacement-builder", actorName: "TivaraWorkerMale", owner: 2,
              position: { x: 640, y: 720, z: 0 } },
            { fixtureActorId: "worker-three", actorName: "TivaraWorkerMale", owner: 2,
              position: { x: 576, y: 656, z: 0 } },
            { fixtureActorId: "worker-four", actorName: "TivaraWorkerMale", owner: 2,
              position: { x: 608, y: 680, z: 0 } },
            { fixtureActorId: "ready-house", actorName: "Olival", owner: 2,
              position: { x: 960, y: 960, z: 0 } },
            { fixtureActorId: "ready-field", actorName: "Field", owner: 2,
              position: { x: 800, y: 640, z: 0 } },
            { fixtureActorId: "ready-granary", actorName: "Granary", owner: 2,
              position: { x: 0, y: 1200, z: 0 } }
          ],
          resourceGrants: [{ playerNumber: 2, amounts: { food: 1000, wood: 1000, stone: 1000, minerals: 1000 } }],
          protectedRoutes: [
            { id: "worker-service", playerNumber: 2, from: { x: 608, y: 736 }, to: { x: 704, y: 672 }, tileMargin: 0 },
            { id: "producer-approach", playerNumber: 2, from: { x: 800, y: 944 }, to: { x: 1056, y: 1088 }, tileMargin: 0 },
            { id: "army-retreat", playerNumber: 2, from: { x: 1024, y: 800 }, to: { x: 608, y: 704 }, tileMargin: 1 }
          ],
          constructionOrders: [{
            fixtureActorId: "unfinished-producer", actorName: ObjectNames.AnkGuard,
            builderFixtureActorIds: ["original-builder"], position: { x: 800, y: 848, z: 0 }
          }],
          events: branch === "intact" ? [] : [{
            id: "construction-interruption", tick: CONSTRUCTION_INTERRUPTION_TICK,
            kind: branch === "builder_loss" ? "destroy_owned_actor" : "cancel_unfinished_site",
            owner: 2, objectName: branch === "builder_loss" ? "TivaraWorkerMale" : "AnkGuard",
            fixtureActorId: branch === "builder_loss" ? "original-builder" : "unfinished-producer"
          }]
        }
      }]
    },
    assertions: {
      "PLACE-03": { maximumTick: 1200, minimumDecisions: 1, minimumAppliedCommands: 1, requiredAiFactions: ["Tivara"] }
    }
  };
}
