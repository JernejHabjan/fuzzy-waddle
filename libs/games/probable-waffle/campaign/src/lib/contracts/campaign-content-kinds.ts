import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";

/**
 * Defines the campaign action kind alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignActionKind = MissionActionDefinition["kind"];
/**
 * Defines the campaign condition kind alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignConditionKind = MissionConditionDefinition["kind"];

export const CAMPAIGN_ACTION_KINDS = [
  "set-fact",
  "set-counter",
  "increment-counter",
  "add-mission-item",
  "consume-mission-item",
  "set-mission-item",
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
  "set-control-perspective",
  "carry-actor",
  "drop-carried-actor",
  "apply-disguise",
  "remove-disguise",
  "ai-directive",
  "set-content-allowance",
  "grant-temporary-modifier",
  "discover-reward",
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
  "mission-item-count",
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
  "actor-distance",
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

/**
 * Defines the closed campaign objective kind value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignObjectiveKind = "primary" | "secondary" | "optional" | "hidden" | "tutorial" | "failure";
/**
 * Defines the closed campaign trigger kind value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignTriggerKind = "event" | "condition";
/**
 * Defines the closed campaign cinematic kind value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignCinematicKind = "gameplay" | "directed" | "paused";
/**
 * Defines the closed campaign ai directive kind value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignAiDirectiveKind =
  | "enable"
  | "disable"
  | "order"
  | "attack"
  | "retreat"
  | "patrol"
  | "move"
  | "stop";
/**
 * Defines the closed campaign reward kind value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignRewardKind =
  | "currency"
  | "story-unlock"
  | "stat-tome"
  | "item"
  | "faction-unlock"
  | "unit-unlock"
  | "building-unlock"
  | "technology-unlock"
  | "temporary-boost"
  | "temporary-resource"
  | "temporary-unit";
/**
 * Defines the campaign trusted hook kind alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignTrustedHookKind = string & { readonly __campaignTrustedHookKind: true };
