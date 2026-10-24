/** Integer tick on the authoritative 20 Hz simulation clock. */
export type AiSimulationTick = number;

/** Stable identity of a persisted strategic plan. */
export type AiPlanId = `plan:${string}`;

/** Stable identity of a plan step that survives suspension and reload. */
export type AiPlanStepId = `step:${string}`;

/** Stable identity of a capability demand, independent of decision tick. */
export type AiDemandId = `demand:${string}`;

/** Stable identity of an exclusive or capacity-bearing claim. */
export type AiClaimId = `claim:${string}`;

/** Stable identity of a proposed action. */
export type AiIntentId = `intent:${string}`;

/** Stable correlation identity shared by an intent and its world effect. */
export type AiEffectId = `effect:${string}`;

/** Stable identity of an AI command within a player authority epoch. */
export type AiCommandId = `command:${string}`;

/** Stable identity of a squad or task force. */
export type AiSquadId = `squad:${string}`;

/** Stable identity of a base or economic service area. */
export type AiBaseId = `base:${string}`;

/** Stable identity of an access-graph node. */
export type AiAccessNodeId = `access:${string}`;

/** Stable identity of a permitted observation fact. */
export type AiEvidenceId = `evidence:${string}`;

/** Stable identity of a question an information mission is meant to answer. */
export type AiQuestionId = `question:${string}`;

/** Stable identity of a causal blocker. */
export type AiBlockerId = `blocker:${string}`;

/** Stable identity of one bounded recovery episode. */
export type AiRecoveryEpisodeId = `recovery:${string}`;

/** Stable identity of a dependency edge used for cycle diagnostics. */
export type AiWaitEdgeId = `wait:${string}`;

/** Stable identity of a transport operation. */
export type AiTransportPlanId = `transport:${string}`;

/** Stable identity of a fortification graph. */
export type AiFortificationPlanId = `fortification:${string}`;

/** Stable identity of a support assignment or temporary effect plan. */
export type AiSupportPlanId = `support:${string}`;

/** Stable identity of an independently refreshed query product. */
export type AiQueryId = `query:${string}`;

/** A persisted simulation deadline; wall-clock time is never valid here. */
export interface AiDeadlineV1 {
  readonly clock: "simulation";
  readonly unit: "tick";
  readonly dueTick: AiSimulationTick;
  readonly persistence: "save";
}

/** Explicitly represents unavailable knowledge instead of fabricating a zero. */
export type AiKnownValueV1<T> =
  | { readonly status: "known"; readonly value: T; readonly observedTick: AiSimulationTick }
  | { readonly status: "unknown"; readonly reason: "not_observed" | "not_supported" | "query_pending" };

/** Creates a persisted simulation-tick deadline. */
export function aiDeadline(dueTick: AiSimulationTick): AiDeadlineV1 {
  assertAiNonNegativeInteger(dueTick, "dueTick");
  return { clock: "simulation", unit: "tick", dueTick, persistence: "save" };
}

/** Rejects NaN, infinity, fractions and negative values at pure data boundaries. */
export function assertAiNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`invalid_ai_integer:${field}`);
  }
}

/** Rejects non-finite or negative measurements while allowing fractional rates. */
export function assertAiNonNegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`invalid_ai_number:${field}`);
  }
}
