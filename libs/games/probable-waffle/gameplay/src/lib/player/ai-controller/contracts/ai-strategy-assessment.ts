/** Saved explanation of a player-fair strategic choice; values use simulation ticks and visible contacts only. */
export interface AiStrategyAssessment {
  readonly choice: "finish" | "pressure" | "recover" | "scout";
  readonly reason: string;
  readonly targetActorId: string | null;
  readonly routeDomain?: "ground" | "air" | "water" | null;
  readonly readyForce: number;
  readonly requiredForce: number;
  readonly visibleThreatCount: number;
  readonly confidencePermille: number;
  readonly expectedEffectTick: number | null;
  readonly reconsiderTick: number;
  /** Last failed offensive mission, retained after its squad leaves the active squad projection. */
  readonly recentFailure?: Readonly<{
    readonly missionCreatedTick: number;
    readonly observedTick: number;
    readonly targetActorId: string | null;
    readonly losses: number;
    readonly repeatedFailures: number;
  }>;
  readonly alternatives: readonly { readonly targetActorId: string; readonly reason: string }[];
}
