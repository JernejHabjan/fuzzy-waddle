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

/**
 * Defines the structured campaign currency definition contract for this module. Its declared surface makes id,
 * title, initial balance explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignCurrencyDefinition {
  /**
   * stable id used by {@link CampaignCurrencyDefinition} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: CampaignCurrencyId;
  /**
   * human-facing title for {@link CampaignCurrencyDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * numeric initial balance carried by {@link CampaignCurrencyDefinition}. Its units and valid range are defined
   * by {@link CampaignCurrencyDefinition} and must remain consistent across producers and consumers.
   */
  readonly initialBalance: number;
}

/**
 * Defines the structured campaign hero definition contract for this module. Its declared surface makes id,
 * title, actor name, faction explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignHeroDefinition {
  /**
   * stable id used by {@link CampaignHeroDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: CampaignHeroId;
  /**
   * human-facing title for {@link CampaignHeroDefinition}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * human-facing actor name for {@link CampaignHeroDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly actorName: ObjectNames;
  /**
   * faction value carried by {@link CampaignHeroDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly faction: FactionType;
}

/**
 * Defines the structured campaign unlock definition contract for this module. Its declared surface makes id,
 * title, kind, chapter id, faction explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignUnlockDefinition {
  /**
   * stable id used by {@link CampaignUnlockDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: CampaignUnlockId;
  /**
   * human-facing title for {@link CampaignUnlockDefinition}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * discriminator for {@link CampaignUnlockDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "story-skill" | "faction" | "unit" | "building" | "technology" | "starting-bonus";
  /**
   * Optional stable chapter id used by {@link CampaignUnlockDefinition} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly chapterId?: CampaignChapterId;
  /**
   * Optional faction value carried by {@link CampaignUnlockDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly faction?: FactionType;
  /**
   * Optional human-facing object name for {@link CampaignUnlockDefinition}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly objectName?: ObjectNames;
  /**
   * Optional discriminator for {@link CampaignUnlockDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly researchType?: ResearchType;
}

/**
 * Defines the structured campaign progression upgrade definition contract for this module. Its declared
 * surface makes id, title, currency id, cost, scope explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignProgressionUpgradeDefinition {
  /**
   * stable id used by {@link CampaignProgressionUpgradeDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: CampaignProgressionUpgradeId;
  /**
   * human-facing title for {@link CampaignProgressionUpgradeDefinition}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * stable currency id used by {@link CampaignProgressionUpgradeDefinition} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly currencyId: CampaignCurrencyId;
  /**
   * numeric cost carried by {@link CampaignProgressionUpgradeDefinition}. Its units and valid range are defined
   * by {@link CampaignProgressionUpgradeDefinition} and must remain consistent across producers and consumers.
   */
  readonly cost: number;
  /**
   * discriminator for {@link CampaignProgressionUpgradeDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly scope:
    | { readonly kind: "global" }
    | { readonly kind: "hero"; readonly heroId: CampaignHeroId }
    | { readonly kind: "faction"; readonly faction: FactionType };
  /**
   * collection value on {@link CampaignProgressionUpgradeDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly modifiers: readonly CampaignProgressionModifier[];
}

/**
 * Defines the structured campaign inventory item definition contract for this module. Its declared surface
 * makes id, title, consumable, modifiers explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignInventoryItemDefinition {
  /**
   * stable id used by {@link CampaignInventoryItemDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: CampaignInventoryItemDefinitionId;
  /**
   * human-facing title for {@link CampaignInventoryItemDefinition}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * consumable value carried by {@link CampaignInventoryItemDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly consumable: boolean;
  /**
   * Optional collection value on {@link CampaignInventoryItemDefinition}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly modifiers?: readonly CampaignProgressionModifier[];
}

/**
 * Defines the structured campaign temporary boost definition contract for this module. Its declared surface
 * makes id, title, modifiers explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignTemporaryBoostDefinition {
  /**
   * stable id used by {@link CampaignTemporaryBoostDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: CampaignTemporaryBoostId;
  /**
   * human-facing title for {@link CampaignTemporaryBoostDefinition}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * collection value on {@link CampaignTemporaryBoostDefinition}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly modifiers: readonly CampaignProgressionModifier[];
}

/**
 * Defines the structured campaign progression definitions contract for this module. Its declared surface makes
 * currencies, heroes, unlocks, upgrades, items explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignProgressionDefinitions {
  /**
   * collection value on {@link CampaignProgressionDefinitions}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly currencies: readonly CampaignCurrencyDefinition[];
  /**
   * collection value on {@link CampaignProgressionDefinitions}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly heroes: readonly CampaignHeroDefinition[];
  /**
   * collection value on {@link CampaignProgressionDefinitions}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly unlocks: readonly CampaignUnlockDefinition[];
  /**
   * collection value on {@link CampaignProgressionDefinitions}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly upgrades: readonly CampaignProgressionUpgradeDefinition[];
  /**
   * collection owned by {@link CampaignProgressionDefinitions}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly items: readonly CampaignInventoryItemDefinition[];
  /**
   * collection value on {@link CampaignProgressionDefinitions}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly temporaryBoosts: readonly CampaignTemporaryBoostDefinition[];
}
