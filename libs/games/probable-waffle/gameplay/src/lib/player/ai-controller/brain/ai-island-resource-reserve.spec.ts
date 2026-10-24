import { FactionType, ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "./create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation } from "../testing/ai-test-fixtures";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { createAiTransportPlanV1 } from "../planning/ai-transport-plan-creation";
import { route, routeRequest } from "../planning/ai-transport-manager-test-fixture";
import { arbitrateAiIntents } from "./ai-intent-arbiter";

function purchase(id: string, cost: number, survival = false): Extract<AiIntentV1, { kind: "construct" }> {
  return { kind: "construct", intentId: `intent:${id}`, effectId: `effect:${id}`, planId: "plan:other", demandId: null,
    lane: "optional_infrastructure_tech", spendingCategory: survival ? "survival" : "economy",
    proposedTick: 20, urgencyClass: 3, utility: 800, preconditions: [], reasonCode: id,
    builderIds: ["worker-1"], objectName: ObjectNames.Olival, logicalPosition: { x: 4, y: 5, z: 0 }, siteKey: id,
    claims: [{ claimId: `claim:${id}`, kind: "resource", resourceType: ResourceType.Wood, amount: cost }] };
}

it("preserves affordable island construction cash without double reserving its actual purchase or blocking survival", () => {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const initial = createAiBrainStateV1({ profile, playerNumber: 1, faction: FactionType.Tivara, tick: 0, archetypeId: "balanced" });
  const plan = createAiTransportPlanV1({ planId: "transport:island-service:source", route, routeRequest, tick: 20,
    missionKind: "island_establishment", estimatedTravelTicks: 40,
    establishment: { sourceActorId: "source", serviceObjectName: ObjectNames.WorkMill, resourceCost: { wood: 50 } },
    passengers: [{ actorId: "worker-1", role: "builder", indispensable: true, handoff: "economy" },
      { actorId: "guard", role: "protection", indispensable: true, handoff: "squad" }] });
  const state = { ...initial, transport: [plan] }, input = createAiTestObservation();
  const optional = purchase("other", 40), survival = purchase("survive", 70, true);
  expect(arbitrateAiIntents(input, state, [optional], [], profile, undefined).accepted).toEqual([]);
  expect(arbitrateAiIntents(input, state, [survival], [], profile, undefined).accepted).toEqual([survival]);
  const foothold = { ...purchase("foothold", 50), planId: "plan:resource-service:source" as const,
    objectName: ObjectNames.WorkMill, utility: 900 };
  expect(arbitrateAiIntents(input, state, [foothold, purchase("remaining", 20)], [], profile, undefined).accepted).toHaveLength(2);
  expect(arbitrateAiIntents(input, { ...state, transport: [{ ...plan, phase: "cancelled" }] }, [optional], [], profile, undefined)
    .accepted).toEqual([optional]);
});
