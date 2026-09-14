import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { AiTransportManager, createAiTransportPlanV1 } from "./ai-transport-manager";
import {
  actor,
  built,
  catalog,
  fromNodeId,
  observation,
  route,
  routeRequest,
  toNodeId
} from "./ai-transport-manager-test-fixture";

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
});

describe("AiTransportManager CommonBoat recovery and handoff", () => {
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
});
