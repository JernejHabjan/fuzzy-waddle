import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";

export type CampaignActionKind = MissionActionDefinition["kind"];
export type CampaignConditionKind = MissionConditionDefinition["kind"];

export const CAMPAIGN_ACTION_KINDS = [
  "set-fact",
  "set-counter",
  "increment-counter",
  "start-timer",
  "pause-timer",
  "cancel-timer",
  "wait-ticks",
  "sequence",
  "parallel",
  "race",
  "spawn-actor",
  "spawn-set",
  "despawn-actor",
  "convert-owner",
  "assign-scenario-role",
  "move-along-route",
  "issue-order",
  "teleport-actor",
  "face-actor",
  "set-actor-flag",
  "revive-actor",
  "damage-actor",
  "heal-actor",
  "begin-attack",
  "create-aoe",
  "remove-aoe",
  "construct-building",
  "complete-construction",
  "destroy-building",
  "toggle-world-object",
  "add-resource",
  "remove-resource",
  "transfer-resource",
  "grant-research",
  "update-alliance",
  "set-ai-enabled",
  "ai-directive",
  "set-content-allowance",
  "grant-temporary-modifier",
  "grant-content",
  "revoke-content-grant",
  "set-objective-state",
  "set-objective-checklist-state",
  "set-encounter-state",
  "set-dialogue-state",
  "set-cinematic-stage",
  "start-dialogue",
  "start-cinematic",
  "create-checkpoint",
  "request-outcome",
  "trusted-hook"
] as const satisfies readonly CampaignActionKind[];

export const CAMPAIGN_CONDITION_KINDS = [
  "always",
  "never",
  "all",
  "any",
  "not",
  "fact",
  "counter",
  "timer",
  "objective",
  "objective-checklist",
  "phase",
  "encounter",
  "actor-exists",
  "actor-alive",
  "actor-owner",
  "actor-type",
  "actor-tag",
  "actor-health",
  "actor-construction",
  "actor-count",
  "produced-count",
  "building-count",
  "region-occupancy",
  "player-resource",
  "research",
  "difficulty",
  "player-count",
  "content-cap"
] as const satisfies readonly CampaignConditionKind[];

export type CampaignObjectiveKind = "primary" | "secondary" | "optional" | "hidden" | "tutorial" | "failure";
export type CampaignTriggerKind = "event" | "condition";
export type CampaignCinematicKind = "gameplay" | "directed" | "paused";
export type CampaignAiDirectiveKind =
  | "enable"
  | "disable"
  | "order"
  | "attack"
  | "retreat"
  | "patrol"
  | "move"
  | "stop";
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
