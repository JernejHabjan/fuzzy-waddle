import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

import { requireValue, combatActor, squad, fixtureState, observation, manager } from "./ai-tactics-test-fixtures";

describe("AiTacticsManager", () => {
  it("H-29 leaves passengers under transport authority until the explicit squad handoff", () => {
    const guard = combatActor("guard", "self", 1);
    const current = fixtureState([squad("squad:landing", "attack", ["guard"])]);
    const transport = {
      planId: "transport:landing",
      phase: "transit",
      passengerIds: ["guard"],
      transportIds: ["carrier"],
      queryIds: ["query:landing"]
    } as AiBrainStateV1["transport"][number];
    const inTransit = manager.propose(observation([guard]), { ...current, transport: [transport] });
    expect(inTransit.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ actorIds: [], state: "recover" })
    );

    const handedOff = manager.propose(observation([guard], 120), {
      ...current,
      transport: [{ ...transport, phase: "handoff" }]
    });
    expect(handedOff.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        actorIds: ["guard"],
        state: "regroup",
        tactics: expect.objectContaining({ script: "land_regroup" })
      })
    );
  });

  it("C-06 makes a bounded decision at the assembly deadline and recovers at the effect deadline", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 10 });
    const current = fixtureState([squad("squad:attack", "attack", ["guard"])]);
    const launch = manager.propose(observation([friend, enemy], 200), current);
    expect(launch.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
    const committed = requireValue(launch.statePatch?.squadUpdates?.[0], "missing_deadline_launch_update");
    const expired = manager.propose(observation([friend, enemy], 1200), { ...current, squads: [committed] });
    expect(expired.statePatch?.squadUpdates?.[0]?.state).toBe("recover");
    expect(expired.statePatch?.squadUpdates?.[0]?.lifecycle).toEqual(
      expect.objectContaining({
        recoveryAttempt: 1,
        terminalReason: "effect_deadline_recovery"
      })
    );
    const recovered = requireValue(expired.statePatch?.squadUpdates?.[0], "missing_deadline_recovery_update");
    const exhausted = manager.propose(observation([friend, enemy], 3600), { ...current, squads: [recovered] });
    expect(exhausted.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        actorIds: [],
        state: "completed",
        lifecycle: expect.objectContaining({ terminalReason: "effect_deadline_exhausted" })
      })
    );
  });

  it("extends a mission deadline when a completed damage effect proves progress", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const currentSquad = squad("squad:attack", "attack", [friend.actorId]);
    const current = fixtureState([currentSquad]);
    const progressed = manager.propose(observation([friend], 1200), {
      ...current,
      pendingOutcomes: [
        {
          identity: {
            matchId: "match:stage13",
            authorityEpoch: 1,
            playerNumber: 1,
            sequence: 8,
            commandId: "command:progress",
            intentId: "intent:progress",
            effectId: "effect:stage13:squad:attack:damage:guard:enemy:1100"
          },
          kind: "completed",
          tick: 1100,
          resultingActorIds: []
        }
      ]
    });

    expect(progressed.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "advance",
        lifecycle: expect.objectContaining({
          lastUsefulEffectTick: 1100,
          effectDeadline: expect.objectContaining({ dueTick: 3600 }),
          recoveryAttempt: 0,
          terminalReason: null
        })
      })
    );
  });

  it("does not treat a movement acknowledgement as useful mission progress", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const currentSquad = squad("squad:attack", "attack", [friend.actorId]);
    const current = fixtureState([currentSquad]);
    const proposal = manager.propose(observation([friend], 1200), {
      ...current,
      pendingOutcomes: [
        {
          identity: {
            matchId: "match:stage13",
            authorityEpoch: 1,
            playerNumber: 1,
            sequence: 8,
            commandId: "command:movement",
            intentId: "intent:movement",
            effectId: "effect:stage13:squad:attack:position:guard:1100"
          },
          kind: "completed",
          tick: 1100,
          resultingActorIds: []
        }
      ]
    });

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "recover",
        lifecycle: expect.objectContaining({
          lastUsefulEffectTick: null,
          recoveryAttempt: 1,
          terminalReason: "effect_deadline_recovery"
        })
      })
    );
  });
});
