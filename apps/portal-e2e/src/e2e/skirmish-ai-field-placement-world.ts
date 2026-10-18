import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";

/** Open safe-room owner branch of PLACE-01; constrained-room and threatened-site branches remain separate obligations. */
export function fieldPlacementWorld(faction: "Tivara" | "Skaduwee"): RuntimeFixtureV1 {
  return {
    schemaVersion: 1, evidenceKind: "runtime", scenarioIds: ["PLACE-01"],
    recipe: {
      mapLabel: "AI Open Economy (test only)", aiPlayerNumber: 2, simulationTimeScale: 1, fixedStepFrames: true,
      checkpointTicks: [20, 200, 400, 800, 1200, 1600, 2000, 2400], variants: [{
        id: `field-placement-${faction.toLowerCase()}`, executionKind: "focused_preset", role: "standalone", seed: 759931,
        aiFaction: faction, humanFaction: faction === "Tivara" ? "Skaduwee" : "Tivara",
        difficulty: "Normal", captureConstruction: true,
        presetWorld: {
          fixtureId: `field-placement-${faction.toLowerCase()}`, requireFactionRoster: true,
          actors: [
            ...Array.from({ length: 16 }, (_, index) => ({
              fixtureActorId: `field-worker-${index}`, actorName: `${faction}WorkerMale`, owner: 2,
              position: { x: 512 + index % 4 * 64, y: 528 + Math.floor(index / 4) * 64, z: 0 }
            })),
            { fixtureActorId: "ready-producer", actorName: faction === "Tivara" ? "AnkGuard" : "InfantryInn", owner: 2,
              position: { x: 800, y: 848, z: 0 } },
            { fixtureActorId: "ready-house", actorName: faction === "Tivara" ? "Olival" : "Emberstone", owner: 2,
              position: { x: 960, y: 960, z: 0 } },
            { fixtureActorId: "ready-granary", actorName: "Granary", owner: 2, position: { x: 0, y: 1200, z: 0 } }
          ],
          resourceGrants: [],
          resourceStarts: [{ playerNumber: 2, amounts: { food: 0, wood: 600, stone: 200, minerals: 200 } }],
          protectedRoutes: [
            { id: "production-reserve", playerNumber: 2, from: { x: 800, y: 944 }, to: { x: 1056, y: 1088 }, tileMargin: 0 },
            { id: "retreat-reserve", playerNumber: 2, from: { x: 1024, y: 800 }, to: { x: 608, y: 704 }, tileMargin: 1 }
          ]
        }
      }]
    },
    assertions: {
      "PLACE-01": { maximumTick: 2400, minimumDecisions: 1, minimumAppliedCommands: 1, requiredAiFactions: [faction] }
    }
  };
}
