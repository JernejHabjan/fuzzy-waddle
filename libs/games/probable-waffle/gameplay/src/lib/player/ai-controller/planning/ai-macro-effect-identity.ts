import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";

/** Derives stable proposal identities from the committed decision sequence. */
export function nextIds(state: AiBrainStateV1, prefix: string, index: number) {
  const suffix = `${state.scheduler.decisionSequence}:${index}`;
  return {
    intentId: `${prefix}:intent:${suffix}` as AiIntentV1["intentId"],
    effectId: `${prefix}:effect:${suffix}` as AiIntentV1["effectId"],
    claimId: `${prefix}:claim:${suffix}` as AiIntentV1["claims"][number]["claimId"]
  };
}

/** Keeps only effect reservations that have no terminal command outcome yet. */
export function unresolvedReservedEffectIds(
  state: AiBrainStateV1,
  subjectPrefix: string
): readonly AiIntentV1["effectId"][] {
  const terminalEffectIds = new Set(
    state.pendingOutcomes
      .filter((outcome) => ["completed", "rejected", "cancelled", "failed"].includes(outcome.kind))
      .map((outcome) => outcome.identity.effectId)
  );
  return state.reservations
    .map((reservation) => reservation.subjectKey)
    .filter((subjectKey): subjectKey is string => subjectKey?.startsWith(subjectPrefix) === true)
    .map((subjectKey) => subjectKey.slice("effect:".length) as AiIntentV1["effectId"])
    .filter((effectId) => !terminalEffectIds.has(effectId))
    .sort();
}
