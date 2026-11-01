import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../brain/create-ai-brain-state";
import { canonicalizeAiBrainState, digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import { assertAiBrainState } from "../contracts/validate-ai-contracts";
import { createAiProfileConfig } from "../profiles/ai-profile-defaults";
import { AiTransportManager, createAiTransportPlan } from "./ai-transport-manager";
import {
  actor,
  built,
  catalog,
  fromNodeId,
  observation,
  route,
  routeRequest
} from "./ai-transport-manager-test-fixture";

describe("AiTransportManager route continuity and persistence", () => {
  it("continues an in-flight operation when a newer graph preserves its route kind", () => {
    const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const source = createAiTransportPlan({
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
        phase: "landing",
        lifecycle: expect.objectContaining({ routeGeneration: 2, terminalReason: null })
      })
    );
    expect(result.intents).toHaveLength(0);
  });

  it("keeps an in-flight operation active during a transient graph rebuild", () => {
    const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const source = createAiTransportPlan({
      planId: "transport:pending-graph",
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
    const actors = [
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
    ];
    const pending = observation(actors, 21);
    const result = new AiTransportManager(() => catalog).propose(
      { ...pending, map: { ...pending.map!, accessGraph: { ...built.graph, generation: 2, status: "pending" } } },
      { ...initial, transport: [plan] }
    );
    expect(result.statePatch?.transport?.[0]).toEqual(expect.objectContaining({ phase: "transit" }));
    expect(result.intents).toHaveLength(0);
  });

  it.each(["boarding", "transit", "unloading"] as const)("preserves canonical save identity during %s", (phase) => {
    const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const plan = createAiTransportPlan({
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
    const state = canonicalizeAiBrainState({ ...initial, transport: [operation] });
    const restored = JSON.parse(JSON.stringify(state));
    assertAiBrainState(restored);
    expect(canonicalizeAiBrainState(restored)).toEqual(state);
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
