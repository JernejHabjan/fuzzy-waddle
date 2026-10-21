import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { PureAiBrain } from "./ai-brain";
import { createAiBrainStateV1 } from "./create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation } from "../testing/ai-test-fixtures";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { AiRecoveryManager } from "../planning/ai-recovery-manager";

/** Persisted otherwise unreachable intermediate states complement native atomic selection/dispatch, by approved H-05 scope. */
it("H-05 releases the complete terminal optional forecast/lease bundle while preserving paid, unknown and foreign ownership", () => {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const initial = createAiBrainStateV1({ profile, playerNumber: 1, faction: FactionType.Tivara, tick: 0,
    archetypeId: "opening:1:balanced" });
  const plan = initial.opening.plan.planId;
  const kinds: readonly AiBrainStateV1["reservations"][number]["state"][] = [
    { kind: "forecast" }, { kind: "provisional", expiresAt: aiDeadline(1000) },
    { kind: "dispatched", commandId: "command:held" }, { kind: "applied_spending", appliedTick: 1 },
    { kind: "refundable_work", refundPending: true }, { kind: "provisional", expiresAt: aiDeadline(1000) }
  ];
  const reservations: AiBrainStateV1["reservations"] = kinds.map((state, index) => ({
    claimId: `claim:optional:${index}` as AiBrainStateV1["reservations"][number]["claimId"],
    ownerPlanId: index === 5 ? "plan:foreign" as typeof plan : plan, state, prerequisites: [], createdTick: 0
  }));
  const record: AiBrainStateV1["recovery"]["records"][number] = { recoveryKey: "optional-original",
    domain: "economy", planId: plan, actorId: null, cause: "blocked", enteredTick: 0, lastProgressTick: 0,
    nextRetryTick: 0, phaseDeadline: aiDeadline(1), attempt: 2, state: "recovering", alternate: null, releasedClaimIds: [] };
  const previous: AiBrainStateV1 = { ...initial, reservations, recovery: { records: [record] },
    authority: { ...initial.authority, pendingCommandIds: ["command:held" as AiBrainStateV1["authority"]["pendingCommandIds"][number]] } };
  const observation = { ...createAiTestObservation(), tick: 100, generation: 1 };
  const catalog = { schemaVersion: 1 as const, generation: 1, entries: [], unsupported: [] };
  const original = JSON.stringify(previous);
  const result = new PureAiBrain(profile, [new AiRecoveryManager(() => catalog)]).step(observation, previous, []);
  expect(result.nextState.recovery.records.find((entry) => entry.recoveryKey === record.recoveryKey)?.releasedClaimIds)
    .toEqual(reservations.slice(0, 2).map((claim) => claim.claimId));
  expect(result.nextState.reservations.map((claim) => claim.claimId)).toEqual(reservations.slice(2).map((claim) => claim.claimId));
  expect(JSON.stringify(previous)).toBe(original);
  // A stale saved list deliberately names every claim; current owner and paid/uncertain authority still win.
  const stale = { ...previous, recovery: { records: [{ ...record, state: "abandoned" as const,
    releasedClaimIds: reservations.map((claim) => claim.claimId) }] } };
  const resumed = new PureAiBrain(profile, []).step(observation, stale, []);
  expect(resumed.nextState.reservations.map((claim) => claim.claimId)).toEqual(reservations.slice(2).map((claim) => claim.claimId));
});
