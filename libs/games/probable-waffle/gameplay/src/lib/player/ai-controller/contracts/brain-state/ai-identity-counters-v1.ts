/** Monotonic counters allocate stable IDs independently of wall time. */
export interface AiIdentityCountersV1 {
  readonly nextPlan: number;
  readonly nextStep: number;
  readonly nextDemand: number;
  readonly nextClaim: number;
  readonly nextIntent: number;
  readonly nextEffect: number;
  readonly nextCommand: number;
  readonly nextEvidence: number;
  readonly nextQuestion: number;
}
