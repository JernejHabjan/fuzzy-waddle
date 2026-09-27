import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { buildAiAccessGraphV1 } from "../planning/ai-access-graph-v1";
import { AiSkirmishManager } from "../planning/ai-skirmish-manager";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "./ai-test-fixtures";

const access = buildAiAccessGraphV1({
  generation: 1, staticRevision: 1, dynamicRevision: 1, threatRevision: 0, builtTick: 0,
  continuationCursor: 0, includeAirRegion: false,
  cells: [
    { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["1,0"],
      knowledge: "known_static", clearance: 2 },
    { x: 1, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["0,0"],
      knowledge: "known_static", clearance: 2 },
    { x: 2, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: [],
      knowledge: "unknown", clearance: 2 }
  ]
});
const home = access.groundNodeByTileKey.get("0,0")!;
const reachable = access.groundNodeByTileKey.get("1,0")!;
const unexplored = access.groundNodeByTileKey.get("2,0")!;
const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1, generation: 1, unsupported: [],
  entries: [{
    capabilityId: "guard", family: "military", sourceObjectName: ObjectNames.TivaraMacemanMale,
    effectiveLevel: 1, movementDomains: ["ground"], targetDomains: ["ground"],
    produces: [], constructs: [], researches: [], gathers: [],
    housingCapacity: null, housingCost: 1, cargoCapacity: null
  }]
};
const manager = new AiSkirmishManager(profile, () => catalog);

function actor(actorId: string, relation: "self" | "enemy", x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: {
      status: "known", value: x === 0 ? home : x === 1 ? reachable : unexplored, observedTick: 20
    },
    capabilities: relation === "self" ? [{
      id: `${actorId}:attack`, family: "military", level: 1,
      domains: ["ground"], targetDomains: ["ground"],
      capacity: { status: "known", value: 0, observedTick: 20 }
    }] : [],
    containedInActorId: null
  };
}

function world(includeWorker: boolean): AiObservationV1 {
  const core: AiObservedActorV1 = {
    ...actor("enemy-core", "enemy", 2),
    mainBuilding: { status: "known", value: true, observedTick: 20 }
  };
  const worker: AiObservedActorV1 = {
    ...actor("enemy-worker", "enemy", 1),
    objectName: ObjectNames.TivaraWorker,
    capabilities: [{
      id: "enemy-worker:gather", family: "gather", level: 1,
      domains: ["ground"], targetDomains: [],
      capacity: { status: "known", value: 1, observedTick: 20 }
    }]
  };
  const actors = [
    actor("guard-a", "self", 0), actor("guard-b", "self", 0), actor("guard-c", "self", 0),
    core, ...(includeWorker ? [worker] : [])
  ];
  return {
    ...createAiTestObservation(),
    actors,
    threatSummary: {
      observedTick: 20,
      visibleEnemyActorIds: includeWorker ? ["enemy-core", "enemy-worker"] : ["enemy-core"],
      rememberedEnemyActorIds: [], observedCapabilityFamilies: []
    },
    map: {
      bounds: { status: "known", value: { width: 3, height: 1 }, observedTick: 20 },
      staticRevision: 1, frontierAccessNodeIds: [unexplored], scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: access.graph
    }
  };
}

function proposal(includeWorker: boolean) {
  return manager.propose(world(includeWorker), createAiBrainStateV1({
    playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced"
  }));
}

describe("STRAT-07 credible-route priority", () => {
  it("chooses a reachable worker ahead of a higher-value core behind unknown topology", () => {
    const result = proposal(true);
    expect(result.statePatch?.strategy?.assessment).toEqual(expect.objectContaining({
      targetActorId: "enemy-worker", routeDomain: "ground", reason: "credible_force_and_route"
    }));
    expect(result.statePatch?.squads?.some((squad) =>
      squad.role === "attack" && squad.objectiveId === "enemy-worker"
    )).toBe(true);
    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-worker"))
      .toBe(true);
  });

  it("retains the unknown core as a scouting fallback without launching a blind attack", () => {
    const result = proposal(false);
    expect(result.statePatch?.strategy?.assessment).toEqual(expect.objectContaining({
      choice: "scout", reason: "route_pending", targetActorId: "enemy-core", expectedEffectTick: null
    }));
    expect(result.statePatch?.strategy?.stance).toBe("stabilize");
    expect(result.statePatch?.squads?.some((squad) => squad.role === "attack")).toBe(false);
    expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("repeats the same selected-route digest across three evaluations", () => {
    const digests = Array.from({ length: 3 }, () =>
      digestCanonicalAiValue(proposal(true).statePatch?.strategy?.assessment)
    );
    expect(new Set(digests).size).toBe(1);
  });
});
