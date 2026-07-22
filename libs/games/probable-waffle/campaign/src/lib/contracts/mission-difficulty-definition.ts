export type CampaignDifficulty = "story" | "normal" | "hard";

export interface MissionDifficultyOverrides {
  readonly startingResourceScale?: number;
  readonly waveSizeScale?: number;
  readonly warningTicks?: number;
  readonly damageScale?: number;
  readonly aiAggressionScale?: number;
}

export interface MissionDifficultyDefinition {
  readonly story: MissionDifficultyOverrides;
  readonly normal: MissionDifficultyOverrides;
  readonly hard: MissionDifficultyOverrides;
  readonly playerCountOverrides?: readonly MissionPlayerCountDifficultyOverride[];
}

export interface MissionPlayerCountDifficultyOverride {
  readonly playerCount: number;
  readonly story?: MissionDifficultyOverrides;
  readonly normal?: MissionDifficultyOverrides;
  readonly hard?: MissionDifficultyOverrides;
}
