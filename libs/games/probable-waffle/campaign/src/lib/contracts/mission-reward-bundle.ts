import type {
  CampaignCurrencyId,
  CampaignInventoryItemDefinitionId,
  CampaignProgressionUpgradeId,
  CampaignTemporaryBoostId,
  CampaignMissionId,
  FactionType,
  ObjectNames,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignUnlockId, MissionObjectiveId, MissionRewardId, MissionTextId } from "./campaign-content-id";

export type MissionRewardScope =
  | { readonly kind: "global" }
  | { readonly kind: "faction"; readonly faction: FactionType }
  | { readonly kind: "actor"; readonly objectName: ObjectNames };

export interface MissionRewardDefinitionBase {
  readonly id: MissionRewardId;
  readonly titleTextId: MissionTextId;
  readonly scope: MissionRewardScope;
  readonly oneTime: boolean;
  readonly objectiveIds?: readonly MissionObjectiveId[];
  readonly hidden?: boolean;
}

export type MissionRewardDefinition =
  | (MissionRewardDefinitionBase & {
      readonly kind: "currency";
      readonly currencyId: CampaignCurrencyId;
      readonly amount: number;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "story-unlock" | "faction-unlock";
      readonly unlockId: CampaignUnlockId;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "stat-tome";
      readonly upgradeId: CampaignProgressionUpgradeId;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "item";
      readonly itemDefinitionId: CampaignInventoryItemDefinitionId;
      readonly quantity: number;
      readonly consumable: boolean;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "unit-unlock" | "building-unlock";
      readonly unlockId: CampaignUnlockId;
      readonly objectName: ObjectNames;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "technology-unlock";
      readonly unlockId: CampaignUnlockId;
      readonly researchType: ResearchType;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "temporary-boost";
      readonly temporaryBoostId: CampaignTemporaryBoostId;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "temporary-resource";
      readonly resourceType: ResourceType;
      readonly amount: number;
    })
  | (MissionRewardDefinitionBase & {
      readonly kind: "temporary-unit";
      readonly objectName: ObjectNames;
      readonly count: number;
    });

export interface MissionRewardBundle {
  readonly schemaVersion: 1;
  readonly missionId: CampaignMissionId;
  readonly rewards: readonly MissionRewardDefinition[];
}
