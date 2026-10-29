import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty
} from "@fuzzy-waddle/probable-waffle-protocol";
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

  it("lets a scout mission renew its own provisional actor lease", () => {
    const f = fixture();
    const scout: AiIntentV1 = {
      ...f.intent,
      kind: "scout",
      intentId: "intent:scout",
      effectId: "effect:scout",
      lane: "scouting",
      utility: 700,
      reasonCode: "frontier_scout"
    };
    expect(arbitrateAiIntents(f.observation, f.state, [scout], [], f.profile, undefined).accepted).toEqual([scout]);
  });

  it("allows a squad's useful cast to replace its own provisional attack lease", () => {
    const f = fixture();
    const cast: AiIntentV1 = {
      ...f.intent,
      kind: "cast",
      intentId: "intent:support-cast",
      effectId: "effect:support-cast",
      utility: 960,
      actorId: "guard",
      spellType: "healingRain",
      targetActorId: null,
      targetPosition: { x: 1, y: 1, z: 0 },
      claims: [{ claimId: "claim:support-caster", kind: "actor", actorId: "guard" }],
      reasonCode: "tactical_support_cast"
    };
    expect(arbitrateAiIntents(f.observation, f.state, [cast], [], f.profile, undefined).accepted).toEqual([cast]);
  });

  it("prioritizes a useful squad cast over its broad same-tick defense attack", () => {
    const f = fixture();
    const cast: AiIntentV1 = {
      ...f.intent,
      kind: "cast",
      intentId: "intent:support-cast",
      effectId: "effect:support-cast",
      utility: 960,
      actorId: "guard",
      spellType: "healingRain",
      targetActorId: null,
      targetPosition: { x: 1, y: 1, z: 0 },
      claims: [{ claimId: "claim:support-caster", kind: "actor", actorId: "guard" }],
      reasonCode: "tactical_support_cast"
    };
    const legacyDefenseAttack: AiIntentV1 = {
      ...f.intent,
      kind: "attack",
      intentId: "intent:legacy-defense-attack",
      effectId: "effect:legacy-defense-attack",
      utility: 940,
      actorIds: ["guard"],
      targetActorId: "enemy",
      targetPosition: null,
      claims: [{ claimId: "claim:legacy-defense", kind: "actor", actorId: "guard" }],
      reasonCode: "legacy_defense_attack"
    };
    const result = arbitrateAiIntents(f.observation, f.state, [legacyDefenseAttack, cast], [], f.profile, undefined);
    expect(result.accepted).toEqual([cast]);
    expect(result.decisions).toContainEqual(
      expect.objectContaining({ intent: legacyDefenseAttack, reason: "claim_conflict" })
    );
  });

  it("keeps another plan's actor lease exclusive", () => {
    const f = fixture();
    const state = {
      ...f.state,
      reservations: f.state.reservations.map((r) => ({ ...r, ownerPlanId: "plan:opening" as const }))
    };
    expect(arbitrateAiIntents(f.observation, state, [f.intent], [], f.profile, undefined).accepted).toEqual([]);
  });

  it("lets construction retask an owned gatherer with an applied actor lease", () => {
    const f = fixture();
    const worker = {
      ...createAiTestOwnedActor("guard"),
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Gather, targetActorId: "wood-source" }
      },
      carriedResourceAmount: 0,
      resourceTransferInFlight: false
    };
    const state = {
      ...f.state,
      reservations: f.state.reservations.map((reservation) => ({
        ...reservation,
        ownerPlanId: "plan:opening" as const,
        state: { kind: "applied_spending" as const, appliedTick: 1 }
      }))
    };
    const construct: AiIntentV1 = {
      ...f.intent,
      kind: "construct",
      intentId: "intent:retask-builder",
      effectId: "effect:retask-builder",
      planId: "plan:opening",
      objectName: ObjectNames.Field,
      builderIds: ["guard"],
      logicalPosition: { x: 6, y: 5, z: 0 },
      siteKey: "field:6,5",
      claims: [{ claimId: "claim:retask-builder", kind: "actor", actorId: "guard" }]
    };

    expect(
      arbitrateAiIntents({ ...f.observation, actors: [worker] }, state, [construct], [], f.profile, undefined).accepted
    ).toEqual([construct]);
  });

  it("does not let construction retask a builder or gatherer with unresolved work", () => {
    const f = fixture();
    const construct: AiIntentV1 = {
      ...f.intent,
      kind: "construct",
      intentId: "intent:retask-builder",
      effectId: "effect:retask-builder",
      planId: "plan:opening",
      objectName: ObjectNames.Field,
      builderIds: ["guard"],
      logicalPosition: { x: 6, y: 5, z: 0 },
      siteKey: "field:6,5",
      claims: [{ claimId: "claim:retask-builder", kind: "actor", actorId: "guard" }]
    };
    const applied = f.state.reservations.map((reservation) => ({
      ...reservation,
      ownerPlanId: "plan:opening" as const,
      state: { kind: "applied_spending" as const, appliedTick: 1 }
    }));
    const gathering = {
      ...createAiTestOwnedActor("guard"),
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Gather, targetActorId: "wood-source" }
      }
    };
    const building = {
      ...gathering,
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Build, targetActorId: "site" }
      }
    };
    const queuedElsewhere = {
      ...gathering,
      pendingOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Move, targetActorId: null }
      }
    };
    const dispatched = applied.map((reservation) => ({
      ...reservation,
      state: { kind: "dispatched" as const, commandId: "old-gather-command" }
    }));
    expect(
      arbitrateAiIntents(
        { ...f.observation, actors: [gathering] },
        { ...f.state, reservations: dispatched },
        [construct],
        [],
        f.profile,
        undefined
      ).accepted
    ).toEqual([]);
    expect(
      arbitrateAiIntents(
        { ...f.observation, actors: [building] },
        { ...f.state, reservations: applied },
        [construct],
        [],
        f.profile,
        undefined
      ).accepted
    ).toEqual([]);
    expect(
      arbitrateAiIntents(
        { ...f.observation, actors: [queuedElsewhere] },
        { ...f.state, reservations: applied },
        [construct],
        [],
        f.profile,
        undefined
      ).accepted
    ).toEqual([]);
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

  it("lets a tactical cast interrupt the same squad's dispatched actor order", () => {
    const f = fixture();
    const dispatched = {
      ...f.state,
      reservations: f.state.reservations.map((r) => ({
        ...r,
        state: { kind: "dispatched" as const, commandId: "old-command" }
      }))
    };
    const cast: AiIntentV1 = {
      ...f.intent,
      kind: "cast",
      intentId: "intent:support-cast",
      effectId: "effect:support-cast",
      actorId: "guard",
      spellType: "healingRain",
      targetActorId: null,
      targetPosition: { x: 1, y: 1, z: 0 },
      claims: [{ claimId: "claim:support-caster", kind: "actor", actorId: "guard" }],
      reasonCode: "tactical_support_cast"
    };
    expect(arbitrateAiIntents(f.observation, dispatched, [cast], [], f.profile, undefined).accepted).toEqual([cast]);
    expect(arbitrateAiIntents(f.observation, dispatched, [f.intent], [], f.profile, undefined).accepted).toEqual([]);
  });
});
