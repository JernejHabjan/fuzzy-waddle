export type CampaignActionKind =
  | "set-fact"
  | "set-counter"
  | "increment-counter"
  | "start-timer"
  | "pause-timer"
  | "cancel-timer"
  | "request-outcome"
  | "trusted-hook";

export type CampaignConditionKind =
  | "always"
  | "never"
  | "all"
  | "any"
  | "not"
  | "fact"
  | "counter"
  | "timer"
  | "objective"
  | "phase"
  | "encounter";

export type CampaignObjectiveKind = "primary" | "secondary" | "optional" | "hidden" | "tutorial" | "failure";
export type CampaignTriggerKind = "event" | "condition";
export type CampaignCinematicKind = "gameplay" | "directed" | "paused";
export type CampaignAiDirectiveKind = "enable" | "disable" | "order" | "attack" | "retreat" | "patrol";
export type CampaignRewardKind =
  | "currency"
  | "story-unlock"
  | "stat-tome"
  | "item"
  | "faction-unlock"
  | "unit-unlock"
  | "building-unlock"
  | "technology-unlock"
  | "temporary-boost";
export type CampaignTrustedHookKind = string & { readonly __campaignTrustedHookKind: true };
