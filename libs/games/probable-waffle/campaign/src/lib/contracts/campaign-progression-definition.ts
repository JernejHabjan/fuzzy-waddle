import type {
  CampaignChapterId,
  CampaignCurrencyId,
  CampaignHeroId,
  CampaignInventoryItemDefinitionId,
  CampaignProgressionModifier,
  CampaignProgressionUpgradeId,
  CampaignTemporaryBoostId,
  CampaignUnlockId,
  FactionType,
  ObjectNames,
  ResearchType
} from "@fuzzy-waddle/probable-waffle-protocol";

export interface CampaignCurrencyDefinition {
  readonly id: CampaignCurrencyId;
  readonly title: string;
  readonly initialBalance: number;
}

export interface CampaignHeroDefinition {
  readonly id: CampaignHeroId;
  readonly title: string;
  readonly actorName: ObjectNames;
  readonly faction: FactionType;
}

export interface CampaignUnlockDefinition {
  readonly id: CampaignUnlockId;
  readonly title: string;
  readonly kind: "story-skill" | "faction" | "unit" | "building" | "technology" | "starting-bonus";
  readonly chapterId?: CampaignChapterId;
  readonly faction?: FactionType;
  readonly objectName?: ObjectNames;
  readonly researchType?: ResearchType;
}

export interface CampaignProgressionUpgradeDefinition {
  readonly id: CampaignProgressionUpgradeId;
  readonly title: string;
  readonly currencyId: CampaignCurrencyId;
  readonly cost: number;
  readonly scope:
    | { readonly kind: "global" }
    | { readonly kind: "hero"; readonly heroId: CampaignHeroId }
    | { readonly kind: "faction"; readonly faction: FactionType };
  readonly modifiers: readonly CampaignProgressionModifier[];
}

export interface CampaignInventoryItemDefinition {
  readonly id: CampaignInventoryItemDefinitionId;
  readonly title: string;
  readonly consumable: boolean;
  readonly modifiers?: readonly CampaignProgressionModifier[];
}

export interface CampaignTemporaryBoostDefinition {
  readonly id: CampaignTemporaryBoostId;
  readonly title: string;
  readonly modifiers: readonly CampaignProgressionModifier[];
}

export interface CampaignProgressionDefinitions {
  readonly currencies: readonly CampaignCurrencyDefinition[];
  readonly heroes: readonly CampaignHeroDefinition[];
  readonly unlocks: readonly CampaignUnlockDefinition[];
  readonly upgrades: readonly CampaignProgressionUpgradeDefinition[];
  readonly items: readonly CampaignInventoryItemDefinition[];
  readonly temporaryBoosts: readonly CampaignTemporaryBoostDefinition[];
}
