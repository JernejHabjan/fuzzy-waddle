import { aiDeadline, type AiPlanId } from "../contracts/ai-core-types";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { planAiDecisions } from "./ai-decision-planner";
import { selectAiCycleVictim } from "./ai-cycle-victim";

function cycleState(pairs: readonly (readonly [AiPlanId, AiPlanId])[]) {
  const fixture = createAiProductionPolicyFixture();
  const state: AiBrainStateV1 = { ...fixture.state,
    waitEdges: pairs.map(([fromPlanId, toPlanId], index) => ({ edgeId: `wait:${index}`, fromPlanId, toPlanId,
      status: "known", deadline: aiDeadline(500), prerequisite: { kind: "worker", capabilityId: "worker" } })),
    reservations: [...new Set(pairs.map(([from]) => from))].map((ownerPlanId, index) => ({
      claimId: `claim:${index}`, ownerPlanId, createdTick: 0, prerequisites: [],
      priority: { urgencyClass: 1, utility: 900 },
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

it("releases the original lowest-priority bundle independently of plan name, edge and claim enumeration", () => {
  const f = cycleState([["plan:a", "plan:z"], ["plan:z", "plan:a"]]);
  const state: AiBrainStateV1 = { ...f.state, reservations: f.state.reservations.map((claim) => ({ ...claim,
    priority: { urgencyClass: claim.ownerPlanId === "plan:z" ? 3 : 0, utility: 950 } })) };
  expect(selectAiCycleVictim(state)).toBe("plan:z");
  expect(selectAiCycleVictim({ ...state, waitEdges: [...state.waitEdges].reverse(),
    reservations: [...state.reservations].reverse() })).toBe("plan:z");
  const result = planAiDecisions(f.observation, state, [], [], f.profile);
  expect(result.state.reservations.map((claim) => claim.ownerPlanId)).toEqual(["plan:a"]);
});

it.each(["dispatched", "applied_spending", "refundable_work"] as const)("protects a bundle with %s work", (kind) => {
  const f = cycleState([["plan:a", "plan:b"], ["plan:b", "plan:a"]]);
  const state: AiBrainStateV1 = { ...f.state, reservations: [...f.state.reservations, {
    claimId: "claim:paid-neighbor", ownerPlanId: "plan:a", createdTick: 0, prerequisites: [],
    state: kind === "dispatched" ? { kind, commandId: "original" } : kind === "applied_spending"
      ? { kind, appliedTick: 10 } : { kind, refundPending: false }
  }] };
  expect(selectAiCycleVictim(state)).toBe("plan:b");
});

it("retains legacy unranked claims and refuses unknown edges as cycle proof", () => {
  const f = cycleState([["plan:a", "plan:b"], ["plan:b", "plan:a"]]);
  expect(selectAiCycleVictim({ ...f.state, reservations: f.state.reservations.map((claim) => ({ ...claim, priority: undefined })) }))
    .toBeNull();
  expect(selectAiCycleVictim({ ...f.state, waitEdges: f.state.waitEdges.map((edge) => ({ ...edge, status: "unknown" })) })).toBeNull();
});

it("protects a provisional label when current original outcomes already prove dispatch/application", () => {
  const f = cycleState([["plan:a", "plan:b"], ["plan:b", "plan:a"]]);
  const state: AiBrainStateV1 = { ...f.state, reservations: f.state.reservations.map((claim) =>
    claim.ownerPlanId === "plan:a" ? { ...claim, subjectKey: "effect:effect:original" } : claim),
    pendingOutcomes: [{ kind: "applied", tick: 100, worldLinkIds: [], identity: { matchId: "match", playerNumber: 1,
      authorityEpoch: 0, sequence: 1, commandId: "command:original", intentId: "intent:original", effectId: "effect:original" } }] };
  expect(selectAiCycleVictim(state)).toBe("plan:b");
  const result = planAiDecisions(f.observation, { ...state, pendingOutcomes: [] }, state.pendingOutcomes, [], f.profile);
  expect(result.preDecisions[0].intent.planId).toBe("plan:b");
});
