import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiBrainStateV1 } from "./create-ai-brain-state-v1";
import { arbitrateAiIntents } from "./ai-intent-arbiter";

function fixture() {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const state = {
    ...createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    }),
    squads: [
      {
        squadId: "squad:attack:primary" as const,
        role: "attack" as const,
        domain: "ground" as const,
        actorIds: ["guard"],
        objectiveId: null,
        state: "retreat" as const
      }
    ],
    reservations: [
      {
        claimId: "claim:old:actor" as const,
        subjectKey: "actor:guard",
        ownerPlanId: "plan:squad:attack:primary" as const,
        createdTick: 0,
        prerequisites: [],
        state: { kind: "provisional" as const, expiresAt: aiDeadline(200) }
      }
    ]
  };
  const intent: AiIntentV1 = {
    kind: "move",
    actorIds: ["guard"],
    logicalPosition: { x: 1, y: 1, z: 0 },
    intentId: "intent:retreat",
    effectId: "effect:retreat",
    planId: "plan:squad:attack:primary",
    demandId: null,
    lane: "army_threat",
    proposedTick: 20,
    urgencyClass: 1,
    utility: 900,
    preconditions: [{ kind: "plan_active", planId: "plan:squad:attack:primary" }],
    claims: [{ claimId: "claim:retreat:actor", kind: "actor", actorId: "guard" }],
    reasonCode: "protected_retreat"
  };
  const observation = { ...createAiTestObservation(), actors: [createAiTestOwnedActor("guard")] };
  return { state, intent, observation, profile };
}

describe("squad actor leases permit tactical correction without stealing ownership", () => {
  it("accepts a retreat before the squad's own previous movement lease expires", () => {
    const f = fixture();
    expect(arbitrateAiIntents(f.observation, f.state, [f.intent], [], f.profile, undefined).accepted).toEqual([
      f.intent
    ]);
  });

  it("keeps another plan's actor lease exclusive", () => {
    const f = fixture();
    const state = {
      ...f.state,
      reservations: f.state.reservations.map((r) => ({ ...r, ownerPlanId: "plan:opening" as const }))
    };
    expect(arbitrateAiIntents(f.observation, state, [f.intent], [], f.profile, undefined).accepted).toEqual([]);
  });

  it("admits only one command for that actor in the same decision", () => {
    const f = fixture();
    const other = { ...f.intent, intentId: "intent:other" as const, effectId: "effect:other" as const, utility: 800 };
    expect(arbitrateAiIntents(f.observation, f.state, [f.intent, other], [], f.profile, undefined).accepted).toEqual([
      f.intent
    ]);
  });

  it("does not release dispatched commitments or a removed squad member", () => {
    const f = fixture();
    const dispatched = {
      ...f.state,
      reservations: f.state.reservations.map((r) => ({
        ...r,
        state: { kind: "dispatched" as const, commandId: "old-command" }
      }))
    };
    expect(arbitrateAiIntents(f.observation, dispatched, [f.intent], [], f.profile, undefined).accepted).toEqual([]);
    expect(
      arbitrateAiIntents(
        f.observation,
        { ...f.state, squads: f.state.squads.map((s) => ({ ...s, actorIds: [] })) },
        [f.intent],
        [],
        f.profile,
        undefined
      ).accepted
    ).toEqual([]);
  });
});
