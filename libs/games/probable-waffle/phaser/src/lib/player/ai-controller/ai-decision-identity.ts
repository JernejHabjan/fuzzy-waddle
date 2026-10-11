/** Native planner identity, scoped to the capture and authority epoch; never a fabricated command/plan ID. */
export interface AiDecisionIdentity {
  readonly playerNumber: number;
  readonly tick: number;
  readonly generation: number;
  readonly decisionSequence: number;
  readonly authorityEpoch: number;
}
