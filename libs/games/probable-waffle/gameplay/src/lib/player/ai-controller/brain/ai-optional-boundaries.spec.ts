import { requireAiTestEntry } from "../testing/ai-test-fixtures";
import { PureAiBrain } from "./ai-brain";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import type { AiProposalManagerV1 } from "../planning/ai-manager-proposal";

function fixture() {
  const f = createAiProductionPolicyFixture();
  const propose = jest.fn(() => ({ managerId: "optional", lane: "scouting" as const,
    evaluated: true, intents: [], reasons: [] }));
  const manager: AiProposalManagerV1 = { managerId: "optional", propose };
  return { ...f, manager, propose };
}

it("preserves retry age across serialized continuation, skips cooldown, then records real recovery", () => {
  const f = fixture();
  f.propose.mockImplementationOnce(() => { throw new Error("optional broke"); });
  const brain = new PureAiBrain(f.profile, [f.manager]);
  const first = brain.step(f.observation, f.state, []);
  const incident = first.nextState.scheduler.boundaryFaults?.[0];
  expect(incident).toMatchObject({ failures: 1, lastFailureTick: f.observation.tick, recoveredTick: null,
    reason: "technical_fault:Error:optional broke" });
  const saved = JSON.parse(JSON.stringify(first.nextState));
  const resumed = new PureAiBrain(f.profile, [f.manager]);
  const early = resumed.step({ ...f.observation, tick: f.observation.tick + 1 }, saved, []);
  expect(f.propose).toHaveBeenCalledTimes(1);
  expect(early.nextState.scheduler.boundaryFaults).toEqual(first.nextState.scheduler.boundaryFaults);
  const tick = incident?.retryAtTick ?? 0;
  const recovered = resumed.step({ ...f.observation, tick }, early.nextState, []);
  expect(f.propose).toHaveBeenCalledTimes(2);
  expect(recovered.nextState.scheduler.boundaryFaults?.[0]).toMatchObject({ failures: 1, recoveredTick: tick });
});

it("a diagnostic exception cannot discard accepted work or poison mandatory authority", () => {
  const f = fixture();
  const other: AiProposalManagerV1 = { managerId: "valid", propose: () => ({ managerId: "valid",
    lane: "essential_economy", evaluated: true, reasons: [], intents: [{ kind: "stop", actorIds: ["worker-0"],
      intentId: "intent:valid", effectId: "effect:valid", planId: "plan:opening", demandId: null,
      lane: "essential_economy", proposedTick: f.observation.tick, urgencyClass: 0, utility: 900,
      preconditions: [], claims: [], reasonCode: "existing_work" }] }) };
  const result = new PureAiBrain(f.profile, [other], { projectDebug: () => { throw new Error("debug only"); } })
    .step(f.observation, f.state, []);
  expect(result.acceptedIntents).toHaveLength(1);
  expect(result.nextState.authority.health).toBe("healthy");
  expect(result.debugSnapshot.completeness.alternatives).toBe("not_recorded");
  expect(requireAiTestEntry(result.nextState.scheduler.boundaryFaults, 0).owner).toBe("debug_projection");
});

it("mandatory corruption is never converted into an empty optional proposal", () => {
  const f = fixture();
  const brain = new PureAiBrain(f.profile, [f.manager], { assertAuthority: () => { throw new Error("mandatory"); } });
  expect(() => brain.step(f.observation, f.state, [])).toThrow("mandatory");
  expect(f.propose).not.toHaveBeenCalled();
  expect(f.state.scheduler.boundaryFaults).toBeUndefined();
});
