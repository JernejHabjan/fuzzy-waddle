import type {
  CampaignCurrencyId,
  CampaignInventoryItemDefinitionId,
  CampaignMissionId,
  CampaignProgressionUpgradeId,
  CampaignTemporaryBoostId,
  FactionType,
  ObjectNames,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignUnlockId, MissionObjectiveId, MissionRewardId, MissionTextId } from "./campaign-content-id";

/**
 * Defines the closed mission reward scope value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type MissionRewardScope =
  | { readonly kind: "global" }
  | { readonly kind: "faction"; readonly faction: FactionType }
  | { readonly kind: "actor"; readonly objectName: ObjectNames };

/**
 * Defines the structured mission reward definition base contract for this module. Its declared surface makes
 * id, title text id, scope, one time, objective ids explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionRewardDefinitionBase {
  /**
   * stable id used by {@link MissionRewardDefinitionBase} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: MissionRewardId;
  /**
   * stable title text id used by {@link MissionRewardDefinitionBase} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly titleTextId: MissionTextId;
  /**
   * discriminator for {@link MissionRewardDefinitionBase}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly scope: MissionRewardScope;
  /**
   * temporal value for {@link MissionRewardDefinitionBase}. It anchors ordering, expiry, or presentation timing
   * and must use the time domain declared by the enclosing contract.
   */
  readonly oneTime: boolean;
  /**
   * Optional collection owned by {@link MissionRewardDefinitionBase}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly objectiveIds?: readonly MissionObjectiveId[];
  /**
   * Optional hidden value carried by {@link MissionRewardDefinitionBase}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly hidden?: boolean;
}

/**
 * Defines the closed mission reward definition value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
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

/**
 * Defines the structured mission reward bundle contract for this module. Its declared surface makes schema
 * version, mission id, rewards explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface MissionRewardBundle {
  /**
   * compatibility schema version for {@link MissionRewardBundle}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * stable mission id used by {@link MissionRewardBundle} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly missionId: CampaignMissionId;
  /**
   * collection owned by {@link MissionRewardBundle}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly rewards: readonly MissionRewardDefinition[];
}
