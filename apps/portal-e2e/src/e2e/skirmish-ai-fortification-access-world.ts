import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { FortificationAccessBranch } from "./skirmish-ai-fortification-access-branch";

/** Fixed native prefab geometry on the frozen open map; ordinary shared movement supplies physical witnesses. */
export function fortificationAccessWorld(branch: FortificationAccessBranch): RuntimeFixtureV1 {
  const stairs = branch.startsWith("stairs_");
  const ring = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].flatMap((dx) => {
    if ((!dx && !dy) || (branch.startsWith("opening_") && dx === -1 && dy === 0)) return [];
    return [{ fixtureActorId: dx === -1 && dy === 0 ? "entrance-wall" : `wall-${dx + 1}-${dy + 1}`,
      actorName: "Wall", owner: 1, position: { x: 320 + (dx - dy) * 32, y: 1168 + (dx + dy) * 16, z: 0 } }];
  }));
  return {
    schemaVersion: 1, evidenceKind: "runtime", scenarioIds: [stairs ? "WALL-03" : "WALL-02"],
    recipe: {
      mapLabel: "AI Open Economy (test only)", aiPlayerNumber: 2, simulationTimeScale: 1, fixedStepFrames: true,
      checkpointTicks: [20, 99, 100, 180, 199, 200, 239, 240, 400, 800], variants: [{
        id: `fortification-access-${branch}`, executionKind: "focused_preset", role: "standalone", seed: 759932,
        aiFaction: "Skaduwee", humanFaction: "Tivara", difficulty: "Normal", captureConstruction: true,
        presetWorld: {
          fixtureId: `fortification-access-${branch.replaceAll("_", "-")}`, requireFactionRoster: true,
          actors: [
            { fixtureActorId: "passage-probe", owner: 1,
              actorName: branch === "opening_army" ? "TivaraMacemanMale" : "TivaraWorkerMale",
              position: stairs ? { x: 256, y: 1136, z: 0 } : { x: 320, y: 1168, z: 0 } },
            ...(stairs ? [
              { fixtureActorId: "wall-first", actorName: "Wall", owner: 1, position: { x: 320, y: 1168, z: 0 } },
              { fixtureActorId: "passage-target", actorName: "Wall", owner: 1, position: { x: 352, y: 1184, z: 0 } },
              ...(branch === "stairs_present" ? [{ fixtureActorId: "access-stairs", actorName: "Stairs", owner: 1,
                position: { x: 288, y: 1152, z: 0 } }] : [])
            ] : [...ring, { fixtureActorId: "passage-target", actorName: "TivaraWorkerMale", owner: 1,
              position: { x: 192, y: 1104, z: 0 } }])
          ],
          resourceGrants: [], controls: [
            { id: "initial-transit", producerFixtureActorId: "passage-probe", requestTick: 100, applicationTick: 100,
              action: { kind: "move_to_actor", targetFixtureActorId: "passage-target" } },
            ...(branch === "breach" ? [{ id: "breach-transit", producerFixtureActorId: "passage-probe",
              requestTick: 240, applicationTick: 240,
              action: { kind: "move_to_actor" as const, targetFixtureActorId: "passage-target" } }] : [])
          ],
          events: branch === "breach" ? [{ id: "open-native-breach", tick: 200, kind: "destroy_owned_actor", owner: 1,
            objectName: "Wall", fixtureActorId: "entrance-wall" }] : []
        }
      }]
    },
    assertions: { [stairs ? "WALL-03" : "WALL-02"]: {
      maximumTick: 800, minimumDecisions: 1, minimumAppliedCommands: 0, requiredAiFactions: ["Skaduwee"]
    } }
  };
}
