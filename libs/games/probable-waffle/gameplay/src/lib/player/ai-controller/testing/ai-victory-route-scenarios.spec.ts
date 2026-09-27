import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
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

function world(includeWorker: boolean, tick = 20): AiObservationV1 {
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
    tick,
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

function brain(): AiBrainStateV1 {
  return createAiBrainStateV1({
    playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced"
  });
}

function proposal(includeWorker: boolean) {
  return manager.propose(world(includeWorker), brain());
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

  it("does not turn an expired assembly deadline into a one-unit attack against a visible defender", () => {
    const defender: AiObservedActorV1 = {
      ...actor("enemy-defender", "enemy", 1),
      capabilities: [{
        id: "enemy-defender:attack", family: "military", level: 1,
        domains: ["ground"], targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }]
    };
    const baseWorld = world(true);
    const openWorld = { ...baseWorld, actors: [baseWorld.actors[0]!, ...baseWorld.actors.slice(3)] };
    const weakWorld = { ...openWorld, actors: [...openWorld.actors, defender] };
    const initial = brain();
    const first = manager.propose(weakWorld, initial);
    const pendingSquads = first.statePatch?.squads;
    if (!pendingSquads || !first.statePatch?.skirmish) throw new Error("missing_assembly_state");
    const later = manager.propose(
      { ...weakWorld, tick: 1300 },
      { ...initial, squads: pendingSquads, skirmish: first.statePatch.skirmish }
    );

    expect(later.statePatch?.strategy?.assessment).toEqual(expect.objectContaining({
      targetActorId: "enemy-worker", readyForce: 1, visibleThreatCount: 1
    }));
    expect(later.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("forming");
    expect(later.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-worker"))
      .toBe(false);

    const openFirst = manager.propose(openWorld, initial);
    if (!openFirst.statePatch?.squads || !openFirst.statePatch.skirmish)
      throw new Error("missing_open_assembly_state");
    const openLater = manager.propose(
      { ...openWorld, tick: 1300 },
      { ...initial, squads: openFirst.statePatch.squads, skirmish: openFirst.statePatch.skirmish }
    );
    expect(openLater.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-worker"))
      .toBe(true);
  });
});
