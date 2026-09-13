import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1, queryAiAccessRouteV1, type AiAccessCellV1 } from "./ai-access-graph-v1";
import { AiSkirmishManager } from "./ai-skirmish-manager";
import { routeCapability } from "./ai-skirmish-support";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "sandhold",
      family: "building",
      sourceObjectName: ObjectNames.Sandhold,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [ObjectNames.CommonBoat],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "common-boat",
      family: "transport",
      sourceObjectName: ObjectNames.CommonBoat,
      effectiveLevel: 1,
      movementDomains: ["water"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: 4
    }
  ]
};

function combatActor() {
  return {
    ...createAiTestOwnedActor("guard"),
    objectName: ObjectNames.TivaraMacemanMale,
    capabilities: [
      {
        id: "guard:attack",
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known" as const, value: 0, observedTick: 20 }
      }
    ]
  };
}

describe("skirmish route capability", () => {
  it("projects a buildable carrier from an owned producer before one exists", () => {
    const producer = { ...createAiTestOwnedActor("sandhold"), objectName: ObjectNames.Sandhold };
    const observation = { ...createAiTestObservation(), actors: [producer, combatActor()] };

    expect(routeCapability(observation, [combatActor()], catalog)).toEqual(
      expect.objectContaining({ waterTransportSeats: 0, canProduceWaterTransport: true })
    );
  });

  it("does not infer carrier production from an unowned catalog entry", () => {
    const observation = { ...createAiTestObservation(), actors: [combatActor()] };

    expect(routeCapability(observation, [combatActor()], catalog)).toEqual(
      expect.objectContaining({ canProduceWaterTransport: false, canProduceAirTransport: false })
    );
  });

  it("seeds one transport child plan for a reachable enemy when the carrier is buildable", () => {
    const cells: readonly AiAccessCellV1[] = [
      {
        x: 0,
        y: 0,
        ground: true,
        water: false,
        elevation: 0,
        groundNeighborKeys: [],
        knowledge: "known_static",
        clearance: 2
      },
      {
        x: 1,
        y: 0,
        ground: false,
        water: true,
        elevation: 0,
        groundNeighborKeys: [],
        knowledge: "known_static",
        clearance: 2
      },
      {
        x: 2,
        y: 0,
        ground: true,
        water: false,
        elevation: 0,
        groundNeighborKeys: [],
        knowledge: "known_static",
        clearance: 2
      }
    ];
    const built = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 20,
      continuationCursor: 0,
      includeAirRegion: true,
      cells
    });
    const source = built.groundNodeByTileKey.get("0,0")!;
    const destination = built.groundNodeByTileKey.get("2,0")!;
    const guard = { ...combatActor(), accessNodeId: { status: "known" as const, value: source, observedTick: 20 } };
    const producer = {
      ...createAiTestOwnedActor("sandhold"),
      objectName: ObjectNames.Sandhold,
      accessNodeId: { status: "known" as const, value: source, observedTick: 20 }
    };
    const enemy = {
      ...combatActor(),
      actorId: "enemy",
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      accessNodeId: { status: "known" as const, value: destination, observedTick: 20 },
      logicalPosition: { status: "known" as const, value: { x: 20, y: 0, z: 0 }, observedTick: 20 }
    };
    const observation = {
      ...createAiTestObservation(),
      generation: 1,
      tick: 20,
      actors: [guard, producer, enemy],
      map: {
        bounds: { status: "known" as const, value: { width: 3, height: 1 }, observedTick: 20 },
        staticRevision: 1,
        frontierAccessNodeIds: [],
        scoutCoverageAccessNodeIds: [],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        accessGraph: built.graph
      }
    };
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const capabilities = routeCapability(observation, [guard], catalog);
    expect(capabilities).toEqual(expect.objectContaining({ canProduceWaterTransport: true }));
    expect(
      queryAiAccessRouteV1(built.graph, {
        queryId: "query:carrier-contract",
        kind: "firing_position",
        fromNodeId: source,
        toNodeId: destination,
        capabilities,
        firingNodeIds: [destination]
      })
    ).toEqual(expect.objectContaining({ kind: "water_transport" }));

    const proposal = new AiSkirmishManager(profile, () => catalog).propose(observation, state);

    expect(proposal.reasons).toContain("transport_child_seeded");
    expect(proposal.statePatch?.transportAppend).toHaveLength(1);
    expect(proposal.statePatch?.transportAppend?.[0]).toEqual(
      expect.objectContaining({ phase: "proposed", passengerIds: ["guard"] })
    );
  });
});
