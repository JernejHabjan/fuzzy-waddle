import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../brain/create-ai-brain-state";
import { createAiProfileConfig } from "../profiles/ai-profile-defaults";
import { AiTransportManager, createAiTransportPlan } from "./ai-transport-manager";
import { actor, built, catalog, fromNodeId, observation, route, routeRequest } from "./ai-transport-manager-test-fixture";
import { aiTransportReleasedClaimIds } from "../brain/ai-transport-released-claims";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainState } from "../contracts/ai-brain-state";

it("H-23 drops a late optional passenger at sufficient original readiness but never drops its required builder", () => {
  const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
  const initial = createAiBrainState({ profile, playerNumber: 1, faction: FactionType.Tivara, tick: 0, archetypeId: "balanced" });
  const source = createAiTransportPlan({ planId: "transport:island-straggler", routeRequest, route, tick: 20,
    missionKind: "island_establishment", estimatedTravelTicks: 40, passengers: [
      { actorId: "builder", role: "builder", indispensable: true, handoff: "economy" },
      { actorId: "guard", role: "protection", indispensable: true, handoff: "squad" },
      { actorId: "optional-ready", role: "worker", indispensable: false, handoff: "economy" },
      { actorId: "optional-late", role: "worker", indispensable: false, handoff: "economy" }
    ] });
  if (!source.lifecycle) throw new Error("required_transport_lifecycle_missing");
  const plan = { ...source, phase: "gather" as const, transportIds: ["boat"], lifecycle: { ...source.lifecycle,
    assignedTransportIds: ["boat"], assignedCapacity: 4,
    pickupTransferId: route.pickupCandidates[0]!.transferId, landingTransferId: route.landingCandidates[0]!.transferId,
    seatAssignments: [{ transportId: "boat", passengerIds: source.passengerIds }] } };
  const boat = { ...actor("boat", ObjectNames.CommonBoat, built.waterNodeByTileKey.get("1,0")!, 1),
    containerState: { status: "known" as const, observedTick: 20, value: { capacity: 4, passengerIds: [], pendingPassengerIds: [],
      mobileDomains: ["water" as const] } } };
  const passengers = source.passengerIds.map((id) => actor(id, id === "guard" ? ObjectNames.TivaraMacemanMale :
    ObjectNames.TivaraWorker, fromNodeId, id === "optional-late" ? 20 : 0));
  const state = { ...initial, transport: [plan] }, manager = new AiTransportManager(() => catalog);
  const departure = manager.propose(observation([...passengers, boat], 21), state).statePatch?.transport?.[0];
  expect(departure?.phase).toBe("rendezvous");
  expect(departure?.passengerIds).not.toContain("optional-late");
  expect(departure?.lifecycle?.requiredCapacity).toBe(4);
  expect(departure?.lifecycle?.departureCapacityPermille).toBe(750);
  const waiting = manager.propose(observation([...passengers.map((member) => member.actorId === "builder" ?
    { ...member, logicalPosition: { status: "known" as const, value: { x: 20, y: 0, z: 0 }, observedTick: 20 } } : member), boat], 21),
    state).statePatch?.transport?.[0];
  expect(waiting?.phase).toBe("gather");
  expect(waiting?.passengerIds).toContain("builder");
  const lost = manager.propose(observation([...passengers.filter((member) => member.actorId !== "optional-late"), boat], 21), state)
    .statePatch?.transport?.[0];
  expect(lost?.lifecycle?.requiredCapacity).toBe(4);
  if (!departure) throw new Error("required_departure_missing");
  const ownerPlanId = `plan:${plan.planId}` as const;
  const reservation: AiBrainState["reservations"][number] = { claimId: "claim:optional-lease", ownerPlanId,
    subjectKey: "actor:optional-late", state: { kind: "provisional", expiresAt: aiDeadline(1000) }, prerequisites: [], createdTick: 20 };
  const held: AiBrainState["reservations"] = [reservation,
    { ...reservation, claimId: "claim:paid", state: { kind: "applied_spending", appliedTick: 20 } },
    { ...reservation, claimId: "claim:unknown", state: { kind: "dispatched", commandId: "original:pending" } },
    { ...reservation, claimId: "claim:foreign", ownerPlanId: "plan:foreign" }];
  expect([...aiTransportReleasedClaimIds({ ...state, reservations: held, transport: [departure] })]).toEqual([reservation.claimId]);
});
