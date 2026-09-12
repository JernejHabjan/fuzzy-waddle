import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { canonicalizeAiBrainStateV1, digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { assertAiBrainStateV1 } from "../contracts/validate-ai-contracts-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1, queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { AiTransportManager, createAiTransportPlanV1 } from "./ai-transport-manager";

const built = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 20,
  continuationCursor: 0,
  includeAirRegion: true,
  cells: [
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
      ground: false,
      water: true,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 3,
      y: 0,
      ground: false,
      water: true,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 4,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    }
  ]
});
const fromNodeId = built.groundNodeByTileKey.get("0,0")!;
const toNodeId = built.groundNodeByTileKey.get("4,0")!;
const routeRequest = {
  queryId: "query:boat-fixture",
  kind: "movement" as const,
  fromNodeId,
  toNodeId,
  capabilities: {
    moverDomains: ["ground" as const],
    targetDomains: [],
    waterTransportSeats: 4,
    airTransportSeats: 0,
    requiredPassengerSeats: 2,
    requiredClearance: 1
  },
  firingNodeIds: []
};
const route = queryAiAccessRouteV1(built.graph, routeRequest);
if (route.kind !== "water_transport") throw new Error("invalid_boat_fixture_route");

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "CommonBoat:level:1",
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

function actor(actorId: string, objectName: ObjectNames, nodeId: typeof fromNodeId, x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: nodeId, observedTick: 20 },
    housingCost: unknownAiValue
  };
}

function observation(actors: readonly AiObservedActorV1[], tick: number): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 5, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: built.graph
    }
  };
}

describe("AiTransportManager CommonBoat lifecycle", () => {
  it("reserves, gathers, boards, travels, unloads, regroups and releases mission ownership", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    let state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const plan = createAiTransportPlanV1({
      planId: "transport:island-1",
      routeRequest,
      route,
      tick: 20,
      missionKind: "island_establishment",
      estimatedTravelTicks: 40,
      passengers: [
        { actorId: "worker-1", role: "builder", indispensable: true, handoff: "economy" },
        { actorId: "guard-1", role: "protection", indispensable: true, handoff: "squad" }
      ]
    });
    state = { ...state, transport: [plan] };
    const manager = new AiTransportManager(() => catalog);
    const boat = {
      ...actor("boat-1", ObjectNames.CommonBoat, built.waterNodeByTileKey.get("1,0")!, 1),
      capabilities: [
        {
          id: "boat",
          family: "transport",
          level: 1,
          domains: ["water" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 4, observedTick: 20 }
        }
      ],
      containerState: {
        status: "known" as const,
        value: { capacity: 4, passengerIds: [], pendingPassengerIds: [], mobileDomains: ["water" as const] },
        observedTick: 20
      }
    };
    const atPickup = [
      actor("worker-1", ObjectNames.TivaraWorker, fromNodeId, 0),
      actor("guard-1", ObjectNames.TivaraMacemanMale, fromNodeId, 0),
      boat
    ];

    for (const tick of [20, 21, 22, 23]) {
      const result = manager.propose(observation(atPickup, tick), state);
      state = { ...state, transport: result.statePatch!.transport! };
    }
    expect(state.transport[0]?.phase).toBe("boarding");
    expect(manager.propose(observation(atPickup, 24), state).intents).toContainEqual(
      expect.objectContaining({ kind: "board", transportId: "boat-1" })
    );

    const loaded = atPickup.map((entry) =>
      entry.actorId === "boat-1"
        ? {
            ...entry,
            containerState: {
              status: "known" as const,
              value: {
                capacity: 4,
                passengerIds: ["guard-1", "worker-1"],
                pendingPassengerIds: [],
                mobileDomains: ["water" as const]
              },
              observedTick: 25
            }
          }
        : { ...entry, containedInActorId: "boat-1" }
    );
    let result = manager.propose(observation(loaded, 25), state);
    state = { ...state, transport: result.statePatch!.transport! };
    expect(state.transport[0]?.phase).toBe("transit");

    const landed = loaded.map((entry) => ({
      ...entry,
      logicalPosition: { status: "known" as const, value: { x: 3, y: 0, z: 0 }, observedTick: 26 }
    }));
    for (const tick of [26, 27]) {
      result = manager.propose(observation(landed, tick), state);
      state = { ...state, transport: result.statePatch!.transport! };
    }
    expect(state.transport[0]?.phase).toBe("unloading");
    expect(manager.propose(observation(landed, 28), state).intents).toContainEqual(
      expect.objectContaining({ kind: "unload", transportId: "boat-1" })
    );

    const unloaded = landed.map((entry) =>
      entry.actorId === "boat-1"
        ? {
            ...entry,
            containerState: {
              status: "known" as const,
              value: { capacity: 4, passengerIds: [], pendingPassengerIds: [], mobileDomains: ["water" as const] },
              observedTick: 29
            }
          }
        : {
            ...entry,
            containedInActorId: null,
            accessNodeId: { status: "known" as const, value: toNodeId, observedTick: 29 }
          }
    );
    for (const tick of [29, 30, 31]) {
      result = manager.propose(observation(unloaded, tick), state);
      state = { ...state, transport: result.statePatch!.transport! };
    }
    expect(state.transport[0]).toEqual(
      expect.objectContaining({ phase: "completed", passengerIds: [], transportIds: [] })
    );
  });

  it("bounds a lost indispensable passenger instead of producing endless boats", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const plan = createAiTransportPlanV1({
      planId: "transport:loss",
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers: [{ actorId: "worker-dead", role: "combat", indispensable: true, handoff: "squad" }]
    });
    const manager = new AiTransportManager(() => catalog);
    const result = manager.propose(observation([], 21), {
      ...initial,
      transport: [{ ...plan, phase: "reserving", lifecycle: { ...plan.lifecycle!, recoveryAttempt: 3 } }]
    });
    expect(result.statePatch?.transport?.[0]).toEqual(expect.objectContaining({ phase: "cancelled" }));
    expect(result.intents).toHaveLength(0);
  });

  it("cancels a second plan that tries to own the same passenger and destination", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const passengers = [
      { actorId: "worker-1", role: "combat" as const, indispensable: true, handoff: "squad" as const }
    ];
    const first = createAiTransportPlanV1({
      planId: "transport:a",
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers
    });
    const second = createAiTransportPlanV1({
      planId: "transport:b",
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers
    });
    const result = new AiTransportManager(() => catalog).propose(
      observation([actor("worker-1", ObjectNames.TivaraWorker, fromNodeId, 0)], 20),
      { ...initial, transport: [second, first] }
    );
    expect(result.statePatch?.transport?.map((entry) => [entry.planId, entry.phase])).toEqual([
      ["transport:a", "reserving"],
      ["transport:b", "cancelled"]
    ]);
  });

  it("revalidates an unsafe landing and enters bounded recovery without unloading", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const source = createAiTransportPlanV1({
      planId: "transport:unsafe",
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers: [{ actorId: "guard-1", role: "combat", indispensable: true, handoff: "squad" }]
    });
    const transportPlan = {
      ...source,
      phase: "landing" as const,
      transportIds: ["boat-1"],
      lifecycle: {
        ...source.lifecycle!,
        assignedTransportIds: ["boat-1"],
        seatAssignments: [{ transportId: "boat-1", passengerIds: ["guard-1"] }],
        assignedCapacity: 1,
        pickupTransferId: route.pickupCandidates[0]!.transferId,
        landingTransferId: route.landingCandidates[0]!.transferId
      }
    };
    const enemies = Array.from({ length: 6 }, (_, index) => ({
      ...actor(`enemy-${index}`, ObjectNames.TivaraMacemanMale, toNodeId, 2),
      relation: "enemy" as const,
      owner: 2,
      visibility: "visible" as const
    }));
    const result = new AiTransportManager(() => catalog).propose(
      observation(
        [
          actor("guard-1", ObjectNames.TivaraMacemanMale, fromNodeId, 1),
          {
            ...actor("boat-1", ObjectNames.CommonBoat, built.waterNodeByTileKey.get("1,0")!, 1),
            containerState: {
              status: "known" as const,
              value: {
                capacity: 4,
                passengerIds: ["guard-1"],
                pendingPassengerIds: [],
                mobileDomains: ["water" as const]
              },
              observedTick: 20
            }
          },
          ...enemies
        ],
        21
      ),
      { ...initial, transport: [transportPlan] }
    );
    expect(result.statePatch?.transport?.[0]).toEqual(expect.objectContaining({ phase: "recovering" }));
    expect(result.intents).toHaveLength(0);
  });

  it("hands off surviving cargo already ashore after its transport is lost", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const source = createAiTransportPlanV1({
      planId: "transport:survivor",
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers: [{ actorId: "guard-1", role: "combat", indispensable: true, handoff: "squad" }]
    });
    const plan = {
      ...source,
      phase: "transit" as const,
      transportIds: ["lost-boat"],
      lifecycle: {
        ...source.lifecycle!,
        assignedTransportIds: ["lost-boat"],
        seatAssignments: [{ transportId: "lost-boat", passengerIds: ["guard-1"] }],
        assignedCapacity: 1
      }
    };
    const survivor = {
      ...actor("guard-1", ObjectNames.TivaraMacemanMale, toNodeId, 4),
      containedInActorId: null
    };
    const manager = new AiTransportManager(() => catalog);
    let result = manager.propose(observation([survivor], 21), { ...initial, transport: [plan] });
    expect(result.statePatch?.transport?.[0]?.phase).toBe("handoff");
    result = manager.propose(observation([survivor], 22), { ...initial, transport: result.statePatch!.transport! });
    expect(result.statePatch?.transport?.[0]).toEqual(
      expect.objectContaining({ phase: "completed", passengerIds: [], transportIds: [] })
    );
  });

  it("stops an in-flight operation when its route generation is invalidated", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const source = createAiTransportPlanV1({
      planId: "transport:stale-route",
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers: [{ actorId: "guard-1", role: "combat", indispensable: true, handoff: "squad" }]
    });
    const plan = {
      ...source,
      phase: "transit" as const,
      transportIds: ["boat-1"],
      lifecycle: {
        ...source.lifecycle!,
        assignedTransportIds: ["boat-1"],
        seatAssignments: [{ transportId: "boat-1", passengerIds: ["guard-1"] }],
        assignedCapacity: 1,
        pickupTransferId: route.pickupCandidates[0]!.transferId,
        landingTransferId: route.landingCandidates[0]!.transferId
      }
    };
    const staleObservation = observation(
      [
        { ...actor("guard-1", ObjectNames.TivaraMacemanMale, fromNodeId, 0), containedInActorId: "boat-1" },
        {
          ...actor("boat-1", ObjectNames.CommonBoat, built.waterNodeByTileKey.get("1,0")!, 1),
          containerState: {
            status: "known" as const,
            value: {
              capacity: 4,
              passengerIds: ["guard-1"],
              pendingPassengerIds: [],
              mobileDomains: ["water" as const]
            },
            observedTick: 21
          }
        }
      ],
      21
    );
    const result = new AiTransportManager(() => catalog).propose(
      { ...staleObservation, map: { ...staleObservation.map!, accessGraph: { ...built.graph, generation: 2 } } },
      { ...initial, transport: [plan] }
    );
    expect(result.statePatch?.transport?.[0]).toEqual(
      expect.objectContaining({
        phase: "recovering",
        lifecycle: expect.objectContaining({ terminalReason: "route_generation_invalidated" })
      })
    );
    expect(result.intents).toHaveLength(0);
  });

  it.each(["boarding", "transit", "unloading"] as const)("preserves canonical save identity during %s", (phase) => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const plan = createAiTransportPlanV1({
      planId: `transport:save:${phase}`,
      routeRequest,
      route,
      tick: 20,
      missionKind: "army_transfer",
      estimatedTravelTicks: 40,
      passengers: [{ actorId: "guard-1", role: "combat", indispensable: true, handoff: "squad" }]
    });
    const operation = {
      ...plan,
      phase,
      transportIds: ["boat-1"],
      lifecycle: {
        ...plan.lifecycle!,
        assignedTransportIds: ["boat-1"],
        seatAssignments: [{ transportId: "boat-1", passengerIds: ["guard-1"] }],
        assignedCapacity: 1,
        pickupTransferId: route.pickupCandidates[0]!.transferId,
        landingTransferId: route.landingCandidates[0]!.transferId
      }
    };
    const state = canonicalizeAiBrainStateV1({ ...initial, transport: [operation] });
    const restored = JSON.parse(JSON.stringify(state));
    assertAiBrainStateV1(restored);
    expect(canonicalizeAiBrainStateV1(restored)).toEqual(state);
    expect(digestCanonicalAiValue(restored)).toBe(digestCanonicalAiValue(state));
    const atLanding = phase === "unloading";
    const loaded = phase !== "boarding";
    const passenger = {
      ...actor("guard-1", ObjectNames.TivaraMacemanMale, fromNodeId, atLanding ? 3 : 0),
      ...(loaded ? { containedInActorId: "boat-1" } : {})
    };
    const boat = {
      ...actor(
        "boat-1",
        ObjectNames.CommonBoat,
        built.waterNodeByTileKey.get(atLanding ? "3,0" : "1,0")!,
        atLanding ? 3 : 1
      ),
      containerState: {
        status: "known" as const,
        value: {
          capacity: 4,
          passengerIds: loaded ? ["guard-1"] : [],
          pendingPassengerIds: [],
          mobileDomains: ["water" as const]
        },
        observedTick: 21
      }
    };
    const manager = new AiTransportManager(() => catalog);
    expect(manager.propose(observation([passenger, boat], 21), restored)).toEqual(
      manager.propose(observation([passenger, boat], 21), state)
    );
  });
});
