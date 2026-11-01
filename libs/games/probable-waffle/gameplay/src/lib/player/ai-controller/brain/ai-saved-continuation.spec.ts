import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { PureAiBrain } from "./ai-brain";
import { createAiBrainState } from "./create-ai-brain-state";
import { migrateAiBrainState } from "./migrate-ai-brain-state";
import { createAiProfileConfig } from "../profiles/ai-profile-defaults";
import { createAiTestObservation } from "../testing/ai-test-fixtures";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainState } from "../contracts/ai-brain-state";

/** Saved leases complement native synchronous dispatch; this control never claims a native intermediate boundary. */
it.each([ProbableWaffleAiDifficulty.Easy, ProbableWaffleAiDifficulty.Medium, ProbableWaffleAiDifficulty.Hard])(
  "H-31 preserves absolute expiry, recovery age, service debt and unknown command ownership across %s migration",
  (difficulty) => {
    const profile = createAiProfileConfig(difficulty);
    const context = { profile, playerNumber: 1, faction: FactionType.Tivara, tick: 199,
      archetypeId: "opening:1:balanced", satisfiedOpeningStepIds: [] };
    const initial = createAiBrainState(context);
    const ownerPlanId = initial.opening.plan.planId;
    const states: readonly AiBrainState["reservations"][number]["state"][] = [
      { kind: "provisional", expiresAt: aiDeadline(200) },
      { kind: "dispatched", commandId: "command:unresolved" },
      { kind: "applied_spending", appliedTick: 20 },
      { kind: "refundable_work", refundPending: true }
    ];
    const original: AiBrainState = { ...initial,
      reservations: states.map((state, index) => ({
        claimId: `claim:saved:${index}` as AiBrainState["reservations"][number]["claimId"],
        ownerPlanId, state, prerequisites: [], createdTick: 1
      })),
      recovery: { records: [{ recoveryKey: "original-blocker", domain: "economy", planId: ownerPlanId,
        actorId: null, cause: "blocked", enteredTick: 1, lastProgressTick: 2, nextRetryTick: 220,
        phaseDeadline: aiDeadline(240), attempt: 3, state: "backoff", alternate: null, releasedClaimIds: [] }] },
      lanes: initial.lanes.map((lane) => ({ ...lane, deficit: 7, lastConsideredTick: 150, lastServicedTick: 10 })),
      authority: { ...initial.authority,
        pendingCommandIds: ["command:unresolved" as AiBrainState["authority"]["pendingCommandIds"][number]] },
      scheduler: { ...initial.scheduler, decisionSequence: 9, accumulatorTicks: 3, rngState: [12345] }
    };
    const encoded = JSON.stringify(original);
    const restored = migrateAiBrainState(JSON.parse(encoded), context);
    expect(restored).toEqual(original);
    const brain = new PureAiBrain(profile, []);
    let uninterrupted = original, resumed = restored;
    for (const tick of [199, 200, 220, 240]) {
      const observation = { ...createAiTestObservation(), tick, generation: tick };
      const control = brain.step(observation, uninterrupted, []);
      const replay = brain.step(observation, resumed, []);
      expect(replay).toEqual(control);
      expect(replay.nextState.reservations.map((claim) => claim.claimId))
        .toEqual(original.reservations.slice(tick < 200 ? 0 : 1).map((claim) => claim.claimId));
      expect(replay.nextState.recovery).toEqual(original.recovery);
      expect(replay.nextState.authority.pendingCommandIds).toEqual(original.authority.pendingCommandIds);
      uninterrupted = control.nextState;
      resumed = replay.nextState;
    }
    expect(JSON.stringify(original)).toBe(encoded);
  }
);
