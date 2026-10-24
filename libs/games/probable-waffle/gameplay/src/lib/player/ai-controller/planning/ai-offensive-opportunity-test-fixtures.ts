import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiSkirmishManager } from "./ai-skirmish-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

const access = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: true,
  cells: [
    {
      x: 0,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: ["1,0"],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 1,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: ["0,0"],
      knowledge: "known_static",
      clearance: 2
    }
  ]
});

const home = access.groundNodeByTileKey.get("0,0")!;

const front = access.groundNodeByTileKey.get("1,0")!;

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "guard",
      family: "military",
      sourceObjectName: ObjectNames.TivaraMacemanMale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

/** Places an observed ground weapon in the shared offensive-route fixture. */
export function guard(actorId: string, relation: "self" | "enemy", x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: relation === "self" ? home : front, observedTick: 20 },
    housingCost: { status: "known", value: 1, observedTick: 20 },
    capabilities: [
      {
        id: `${actorId}:attack`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }
    ],
    containedInActorId: null
  };
}

export function core(actorId: string): AiObservedActorV1 {
  return {
    ...guard(actorId, "enemy", 1),
    housingCost: { status: "known", value: 0, observedTick: 20 },
    capabilities: [],
    mainBuilding: { status: "known", value: true, observedTick: 20 }
  };
}

export function producer(actorId: string): AiObservedActorV1 {
  return {
    ...core(actorId),
    mainBuilding: { status: "known", value: false, observedTick: 20 },
    capabilities: [
      {
        id: `${actorId}:produce`,
        family: "produce",
        level: 1,
        domains: ["ground"],
        targetDomains: [],
        capacity: { status: "known", value: 1, observedTick: 20 }
      }
    ]
  };
}

/** Exposes the fixed route graph and the supplied contacts without invoking an applied-world adapter. */
export function world(actors: readonly AiObservedActorV1[], tick = 20): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [front],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: access.graph
    }
  };
}

export function brain(): AiBrainStateV1 {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
}

export const manager = new AiSkirmishManager(profile, () => catalog);
