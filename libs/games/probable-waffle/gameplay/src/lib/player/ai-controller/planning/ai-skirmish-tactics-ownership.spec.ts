import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import { retainAiSquadTacticsForActors } from "./ai-skirmish-tactics-ownership";

it("removes per-actor orders, positions and damage reservations when membership changes", () => {
  const tactics = {
    taskForceId: "task-force:1",
    script: "hold_front",
    targetActorId: "target",
    targetScore: 800,
    engagementRatioPermille: 1000,
    confidencePermille: 1000,
    predictedFriendlyLossPermille: 0,
    predictedEnemyLossPermille: 0,
    lastObservedMemberCount: 2,
    observedLossCount: 0,
    lastTransitionTick: 20,
    nextReconsiderTick: 40,
    oscillationCount: 0,
    orderSignature: "attack:target",
    orderedActorIds: ["retained", "reassigned"],
    assignedPositions: [
      { actorId: "retained", position: { x: 1, y: 0, z: 0 } },
      { actorId: "reassigned", position: { x: 2, y: 0, z: 0 } }
    ],
    damageReservations: [
      { actorId: "retained", targetActorId: "target", expectedDamage: 5, impactTick: 30 },
      { actorId: "reassigned", targetActorId: "target", expectedDamage: 5, impactTick: 30 }
    ],
    protectedRouteNodeIds: [],
    mobileReserveActorIds: [],
    objectiveAlternatives: []
  } satisfies NonNullable<AiSquadStateV1["tactics"]>;

  expect(retainAiSquadTacticsForActors(tactics, ["retained"])).toMatchObject({
    orderedActorIds: ["retained"],
    assignedPositions: [{ actorId: "retained" }],
    damageReservations: [{ actorId: "retained" }]
  });
});
