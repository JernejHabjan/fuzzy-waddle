import { aiDeadline, type AiPlanId } from "../contracts/ai-core-types";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { planAiDecisions } from "./ai-decision-planner";

function cycleState(pairs: readonly (readonly [AiPlanId, AiPlanId])[]) {
  const fixture = createAiProductionPolicyFixture();
  const state: AiBrainStateV1 = { ...fixture.state,
    waitEdges: pairs.map(([fromPlanId, toPlanId], index) => ({ edgeId: `wait:${index}`, fromPlanId, toPlanId,
      status: "known", deadline: aiDeadline(500), prerequisite: { kind: "worker", capabilityId: "worker" } })),
    reservations: [...new Set(pairs.map(([from]) => from))].map((ownerPlanId, index) => ({
      claimId: `claim:${index}`, ownerPlanId, createdTick: 0, prerequisites: [],
      state: { kind: "provisional", expiresAt: aiDeadline(500) } })) };
  return { ...fixture, state };
}

it("finds a cycle behind an additional outgoing edge, without releasing its acyclic feeder", () => {
  const f = cycleState([["plan:a", "plan:b"], ["plan:b", "plan:c"], ["plan:b", "plan:d"], ["plan:c", "plan:b"]]);
  const normal = planAiDecisions(f.observation, f.state, [], [], f.profile);
  const reverse = planAiDecisions(f.observation, { ...f.state, waitEdges: [...f.state.waitEdges].reverse() }, [], [], f.profile);
  expect(normal.preDecisions).toHaveLength(1);
  expect(normal.preDecisions[0].intent.planId).toBe("plan:b");
  expect(reverse.preDecisions).toEqual(normal.preDecisions);
  expect(normal.state.reservations.some((claim) => claim.ownerPlanId === "plan:a")).toBe(true);
});

it("does not mistake converging acyclic dependency paths for a cycle", () => {
  const f = cycleState([["plan:a", "plan:b"], ["plan:a", "plan:c"], ["plan:b", "plan:d"], ["plan:c", "plan:d"]]);
  const result = planAiDecisions(f.observation, f.state, [], [], f.profile);
  expect(result.preDecisions).toEqual([]);
  expect(result.state.reservations).toEqual(f.state.reservations);
});
