import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../../../brain/state/create-ai-brain-state";
import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiObservation, AiObservedActor } from "../../../contracts/observation/ai-observation";
import { createAiProfileConfig } from "../../../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../coordination/ai-test-fixtures";
import { buildAiAccessGraph } from "../../../planning/access/ai-access-graph";
import { AiSkirmishManager } from "../../../planning/strategy/missions/ai-skirmish-manager";

const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);

const access = buildAiAccessGraph({
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

const catalog: AiCapabilityCatalog = {
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
export function guard(actorId: string, relation: "self" | "enemy", x: number): AiObservedActor {
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

export function core(actorId: string): AiObservedActor {
  return {
    ...guard(actorId, "enemy", 1),
    housingCost: { status: "known", value: 0, observedTick: 20 },
    capabilities: [],
    mainBuilding: { status: "known", value: true, observedTick: 20 }
  };
}

export function producer(actorId: string): AiObservedActor {
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
export function world(actors: readonly AiObservedActor[], tick = 20): AiObservation {
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

export function brain(): AiBrainState {
  return createAiBrainState({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
}

export const manager = new AiSkirmishManager(profile, () => catalog);
