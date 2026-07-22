import type {
  CampaignActionKind,
  CampaignAiDirectiveKind,
  CampaignCinematicKind,
  CampaignConditionKind,
  CampaignObjectiveKind,
  CampaignRewardKind,
  CampaignTriggerKind
} from "../contracts/campaign-content-kinds";
import { CAMPAIGN_ACTION_KINDS, CAMPAIGN_CONDITION_KINDS } from "../contracts/campaign-content-kinds";
import type { MissionTrustedHookId } from "../contracts/campaign-content-id";
import { CampaignKindRegistry } from "./campaign-kind-registry";
import type { CampaignRegistryRegistration } from "./campaign-registry-registration";
import type { TrustedCampaignHookRegistration } from "./trusted-campaign-hook-registration";

export class CampaignDefinitionRegistries {
  readonly actions = new CampaignKindRegistry<CampaignActionKind, CampaignRegistryRegistration<CampaignActionKind>>();
  readonly conditions = new CampaignKindRegistry<
    CampaignConditionKind,
    CampaignRegistryRegistration<CampaignConditionKind>
  >();
  readonly objectives = new CampaignKindRegistry<
    CampaignObjectiveKind,
    CampaignRegistryRegistration<CampaignObjectiveKind>
  >();
  readonly triggers = new CampaignKindRegistry<
    CampaignTriggerKind,
    CampaignRegistryRegistration<CampaignTriggerKind>
  >();
  readonly cinematics = new CampaignKindRegistry<
    CampaignCinematicKind,
    CampaignRegistryRegistration<CampaignCinematicKind>
  >();
  readonly aiDirectives = new CampaignKindRegistry<
    CampaignAiDirectiveKind,
    CampaignRegistryRegistration<CampaignAiDirectiveKind>
  >();
  readonly rewards = new CampaignKindRegistry<CampaignRewardKind, CampaignRegistryRegistration<CampaignRewardKind>>();
  readonly trustedHooks = new CampaignKindRegistry<MissionTrustedHookId, TrustedCampaignHookRegistration>();
}

function registerKinds<TKind extends string>(
  registry: CampaignKindRegistry<TKind, CampaignRegistryRegistration<TKind>>,
  kinds: readonly TKind[]
): void {
  for (const kind of kinds) registry.register({ kind, description: `Built-in campaign ${kind} definition` });
}

/** Creates the schema-level registry set; runtime executors attach to the same stable kinds in their owning layer. */
export function createDefaultCampaignDefinitionRegistries(): CampaignDefinitionRegistries {
  const registries = new CampaignDefinitionRegistries();
  registerKinds(registries.actions, CAMPAIGN_ACTION_KINDS);
  registerKinds(registries.conditions, CAMPAIGN_CONDITION_KINDS);
  registerKinds(registries.objectives, ["primary", "secondary", "optional", "hidden", "tutorial", "failure"]);
  registerKinds(registries.triggers, ["event", "condition"]);
  registerKinds(registries.cinematics, ["gameplay", "directed", "paused"]);
  registerKinds(registries.aiDirectives, ["enable", "disable", "order", "attack", "retreat", "patrol", "move", "stop"]);
  registerKinds(registries.rewards, [
    "currency",
    "story-unlock",
    "stat-tome",
    "item",
    "faction-unlock",
    "unit-unlock",
    "building-unlock",
    "technology-unlock",
    "temporary-boost"
  ]);
  return registries;
}
