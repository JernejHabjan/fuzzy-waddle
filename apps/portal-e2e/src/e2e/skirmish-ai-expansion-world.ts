import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { ExpansionBranch } from "./skirmish-ai-expansion-branch";
import { EXPANSION_HOME_RAIDER_ROLES } from "./skirmish-ai-expansion-branch";

/** Deplete actual inherited stocks, fairly reveal two remote choices and let the ordinary AI own all expansion work. */
export function expansionWorld(faction: "Tivara" | "Skaduwee", branch: ExpansionBranch): RuntimeFixtureV1 {
  const tivara = faction === "Tivara", pressure = !["expand", "served"].includes(branch);
  const inherited = [
    [ObjectNames.Tree6, -672, 640], [ObjectNames.Tree6, -960, 736], [ObjectNames.Tree6, 288, 752],
    [ObjectNames.Tree6, 608, 928], [ObjectNames.StonePile, -688, 784], [ObjectNames.StonePile, 272, 960],
    [ObjectNames.Minerals, -992, 608], [ObjectNames.Minerals, 752, 784]
  ] as const;
  const inheritedBindings = inherited.map(([actorName, x, y], index) => ({
    fixtureActorId: `inherited-source-${index}`, actorName, owner: null, position: { x, y, z: 0 }
  }));
  return {
    schemaVersion: 1, evidenceKind: "runtime", scenarioIds: ["EXP-01", "EXP-02"],
    recipe: {
      mapLabel: "AI Open Economy (test only)", aiPlayerNumber: 2, simulationTimeScale: 1, fixedStepFrames: true,
      checkpointTicks: [20, 100, 199, 200, 400, 600, 1000, 1600, 2400, 3000], variants: [{
        id: `${faction.toLowerCase()}-expansion-${branch}`, executionKind: "focused_preset", role: "standalone", seed: 759933,
        deadlineRationale: "The original EXP-02 ceiling covers native home defense, recovery, paid service and first delivered wood.",
        aiFaction: faction, humanFaction: tivara ? "Skaduwee" : "Tivara", difficulty: "Normal",
        captureConstruction: true, captureCombat: true,
        presetWorld: {
          fixtureId: `${faction.toLowerCase()}-expansion-${branch.replaceAll("_", "-")}`, requireFactionRoster: true,
          existingActorBindings: [...inheritedBindings,
            { fixtureActorId: "original-home", actorName: tivara ? ObjectNames.Sandhold : ObjectNames.FrostForge, owner: 2 }],
          actors: [
            ...Array.from({ length: 6 }, (_, index) => ({ fixtureActorId: `expansion-worker-${index}`,
              actorName: `${faction}WorkerMale`, owner: 2,
              position: { x: 576 + index % 3 * 64, y: 656 + Math.floor(index / 3) * 64, z: 0 }
            })),
            { fixtureActorId: "ready-producer", actorName: tivara ? "AnkGuard" : "InfantryInn", owner: 2,
              position: { x: 800, y: 848, z: 0 } },
            { fixtureActorId: "ready-house", actorName: tivara ? "Olival" : "Emberstone", owner: 2,
              position: { x: 960, y: 960, z: 0 } },
            { fixtureActorId: "ready-granary", actorName: "Granary", owner: 2, position: { x: 0, y: 1200, z: 0 } },
            { fixtureActorId: "ready-field", actorName: "Field", owner: 2, position: { x: 800, y: 640, z: 0 } },
            { fixtureActorId: "safe-source", actorName: "Tree11", owner: null, position: { x: -192, y: 1152, z: 0 } },
            { fixtureActorId: "unsafe-source", actorName: "Tree9", owner: null, position: { x: -768, y: 1056, z: 0 } },
            { fixtureActorId: "safe-observer", actorName: tivara ? "TivaraMacemanMale" : "SkaduweeWarriorMale", owner: 2,
              position: { x: -96, y: 1120, z: 0 } },
            { fixtureActorId: "unsafe-observer", actorName: tivara ? "TivaraMacemanMale" : "SkaduweeWarriorMale", owner: 2,
              position: { x: -480, y: 928, z: 0 } },
            { fixtureActorId: "unsafe-defense", actorName: "WatchTower", owner: 1, position: { x: -800, y: 1088, z: 0 } },
            ...(branch === "served" ? [{ fixtureActorId: "existing-expansion", actorName: "WorkMill",
              owner: 2, position: { x: -64, y: 1264, z: 0 } }] : []),
            ...(pressure ? EXPANSION_HOME_RAIDER_ROLES.map((fixtureActorId, index) => ({ fixtureActorId,
              actorName: tivara ? "SkaduweeWarriorMale" : "TivaraMacemanMale",
              owner: 1, position: index === 3 ? { x: 768, y: 960, z: 0 } : { x: 640 + index * 64, y: 1024, z: 0 } })) : [])
          ],
          resourceGrants: [], resourceStarts: [{ playerNumber: 2,
            amounts: { food: 1200, wood: 1600, stone: 800, minerals: 800 } }],
          sourceStocks: [...inheritedBindings.map((binding) => ({ fixtureActorId: binding.fixtureActorId, amount: 0 })),
            { fixtureActorId: "ready-field", amount: 0 }, { fixtureActorId: "safe-source", amount: 240 }],
          controls: pressure ? [
            ...EXPANSION_HOME_RAIDER_ROLES.map((producerFixtureActorId, index) => ({
              id: index ? `attack-original-home-${index}` : "attack-original-home", producerFixtureActorId,
              requestTick: 0, applicationTick: 0, action: { kind: "attack" as const, targetFixtureActorId: "original-home" }
            })),
            ...(branch === "pressure_withdrawn" ? EXPANSION_HOME_RAIDER_ROLES.map((producerFixtureActorId, index) => ({
              id: index ? `withdraw-home-pressure-${index}` : "withdraw-home-pressure", producerFixtureActorId,
              // Let the original attack cause serious home damage before the pressure is withdrawn.
              requestTick: 440, applicationTick: 440,
              action: { kind: "move" as const, worldPosition: { x: -320 + index * 64, y: 256, z: 0 } }
            })) : [])
          ] : []
        }
      }]
    },
    assertions: {
      "EXP-01": { maximumTick: 3000, minimumDecisions: 1, minimumAppliedCommands: 1, requiredAiFactions: [faction] },
      "EXP-02": { maximumTick: 3000, minimumDecisions: 1, minimumAppliedCommands: 1, requiredAiFactions: [faction] }
    }
  };
}
