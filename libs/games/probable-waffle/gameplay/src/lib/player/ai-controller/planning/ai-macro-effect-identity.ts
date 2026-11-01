import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiIntent } from "../contracts/ai-intent";

/** Derives stable proposal identities from the committed decision sequence. */
export function nextIds(state: AiBrainState, prefix: string, index: number) {
  const suffix = `${state.scheduler.decisionSequence}:${index}`;
  return {
    intentId: `${prefix}:intent:${suffix}` as AiIntent["intentId"],
    effectId: `${prefix}:effect:${suffix}` as AiIntent["effectId"],
    claimId: `${prefix}:claim:${suffix}` as AiIntent["claims"][number]["claimId"]
  };
}

/** Keeps only effect reservations that have no terminal command outcome yet. */
export function unresolvedReservedEffectIds(
  state: AiBrainState,
  subjectPrefix: string
): readonly AiIntent["effectId"][] {
  const terminalEffectIds = new Set(
    state.pendingOutcomes
      .filter((outcome) => ["completed", "rejected", "cancelled", "failed"].includes(outcome.kind))
      .map((outcome) => outcome.identity.effectId.replace(/^effect:/, ""))
  );
  return state.reservations
    .map((reservation) => reservation.subjectKey)
    .filter((subjectKey): subjectKey is string => subjectKey?.startsWith(subjectPrefix) === true)
    .map((subjectKey) => subjectKey.slice("effect:".length) as AiIntent["effectId"])
    .filter((effectId) => !terminalEffectIds.has(effectId.replace(/^effect:/, "")))
    .sort();
}
