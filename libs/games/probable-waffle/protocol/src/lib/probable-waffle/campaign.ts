import type { ProbableWaffleMapKey } from "./probable-waffle";
import type { ProbableWaffleGameInstanceData } from "../game-instance/probable-waffle/game-instance";
import type { FactionType } from "../game-instance/probable-waffle/player";
import type { ObjectNames } from "../game-instance/probable-waffle/object-names";
import type { ResourceType } from "./resource-type-definition";

/** Defines the campaign id contract used by this module; its declared members form the compatible boundary for linked consumers. */
export type CampaignId = "ashes-of-the-ancients";
/**
 * Defines the closed campaign chapter id value set. Keeping this union named preserves exhaustive handling and
 * prevents incompatible free-form values at its boundaries.
 */
export type CampaignChapterId =
  | "prologue"
  | "two-homelands"
  | "crystal-war"
  | "united-against-volcano"
  | "the-betrayal";
/**
 * Defines the closed campaign mission id value set. Keeping this union named preserves exhaustive handling and
 * prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionId =
  | "dreams"
  | "cyclops-and-sheep"
  | "snow-wendigo-and-fire"
  | "slingshooters-and-wolves"
  | "owl-and-skaduwee-crystal"
  | "sand-dunes-and-tivara-crystal"
  | "we-had-enough"
  | "sailing-towards-the-new-future"
  | "the-first-and-last-dinner"
  | "the-siege"
  | "time-rush"
  | "joining-crystal"
  | "mobster-or-friend"
  | "the-volcano-is-getting-angry"
  | "cult-wars"
  | "the-volcano"
  | "the-betrayal"
  | "undead-and-cursed-lands"
  | "end-game"
  | "resolution";

export const CAMPAIGN_IDS: readonly CampaignId[] = ["ashes-of-the-ancients"];

export const CAMPAIGN_CHAPTER_IDS: readonly CampaignChapterId[] = [
  "prologue",
  "two-homelands",
  "crystal-war",
  "united-against-volcano",
  "the-betrayal"
];

export const CAMPAIGN_MISSION_IDS: readonly CampaignMissionId[] = [
  "dreams",
  "cyclops-and-sheep",
  "snow-wendigo-and-fire",
  "slingshooters-and-wolves",
  "owl-and-skaduwee-crystal",
  "sand-dunes-and-tivara-crystal",
  "we-had-enough",
  "sailing-towards-the-new-future",
  "the-first-and-last-dinner",
  "the-siege",
  "time-rush",
  "joining-crystal",
  "mobster-or-friend",
  "the-volcano-is-getting-angry",
  "cult-wars",
  "the-volcano",
  "the-betrayal",
  "undead-and-cursed-lands",
  "end-game",
  "resolution"
];

/** Documents the campaign mission chapter member and its declared contract at this boundary. */
const CAMPAIGN_MISSION_CHAPTER: ReadonlyMap<CampaignMissionId, CampaignChapterId> = new Map([
  ["dreams", "prologue"],
  ["cyclops-and-sheep", "two-homelands"],
  ["snow-wendigo-and-fire", "two-homelands"],
  ["slingshooters-and-wolves", "two-homelands"],
  ["owl-and-skaduwee-crystal", "two-homelands"],
  ["sand-dunes-and-tivara-crystal", "two-homelands"],
  ["we-had-enough", "two-homelands"],
  ["sailing-towards-the-new-future", "crystal-war"],
  ["the-first-and-last-dinner", "crystal-war"],
  ["the-siege", "crystal-war"],
  ["time-rush", "crystal-war"],
  ["joining-crystal", "crystal-war"],
  ["mobster-or-friend", "united-against-volcano"],
  ["the-volcano-is-getting-angry", "united-against-volcano"],
  ["cult-wars", "united-against-volcano"],
  ["the-volcano", "united-against-volcano"],
  ["the-betrayal", "the-betrayal"],
  ["undead-and-cursed-lands", "the-betrayal"],
  ["end-game", "the-betrayal"],
  ["resolution", "the-betrayal"]
]);

export function isCampaignChapterId(value: string | null): value is CampaignChapterId {
  return value !== null && (CAMPAIGN_CHAPTER_IDS as readonly string[]).includes(value);
}

export function isCampaignId(value: string | null): value is CampaignId {
  return value !== null && (CAMPAIGN_IDS as readonly string[]).includes(value);
}

export function isCampaignMissionId(value: string | null): value is CampaignMissionId {
  return value !== null && (CAMPAIGN_MISSION_IDS as readonly string[]).includes(value);
}

/** Documents the is campaign mission in chapter member and its declared contract at this boundary. */
export function isCampaignMissionInChapter(chapterId: CampaignChapterId, missionId: CampaignMissionId): boolean {
  return CAMPAIGN_MISSION_CHAPTER.get(missionId) === chapterId;
}

/**
 * Defines the closed campaign mission layout classification. Use an explicit member rather than a free-form
 * string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum CampaignMissionLayout {
  /**
   * Selects the `Single` case of {@link CampaignMissionLayout}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Single = "single",
  /**
   * Selects the `Parallel` case of {@link CampaignMissionLayout}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Parallel = "parallel",
  /**
   * Selects the `Collision` case of {@link CampaignMissionLayout}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Collision = "collision",
  /**
   * Selects the `United` case of {@link CampaignMissionLayout}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  United = "united",
  /**
   * Selects the `Finale` case of {@link CampaignMissionLayout}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Finale = "finale"
}

/**
 * Defines the closed campaign faction classification. Use an explicit member rather than a free-form string so
 * branching, persistence, and diagnostics share the same vocabulary.
 */
export enum CampaignFaction {
  /**
   * Selects the `Tivara` case of {@link CampaignFaction}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Tivara = "tivara",
  /**
   * Selects the `Skaduwee` case of {@link CampaignFaction}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Skaduwee = "skaduwee",
  /**
   * Selects the `Both` case of {@link CampaignFaction}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Both = "both",
  /**
   * Selects the `Switching` case of {@link CampaignFaction}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Switching = "switching"
}

/**
 * Defines the closed campaign content type classification. Use an explicit member rather than a free-form
 * string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum CampaignContentType {
  /**
   * Selects the `Mission` case of {@link CampaignContentType}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Mission = "mission",
  /**
   * Selects the `Cinematic` case of {@link CampaignContentType}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Cinematic = "cinematic"
}

/**
 * Defines the closed campaign availability classification. Use an explicit member rather than a free-form
 * string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum CampaignAvailability {
  /**
   * Selects the `Playable` case of {@link CampaignAvailability}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Playable = "playable",
  /**
   * Selects the `Planned` case of {@link CampaignAvailability}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Planned = "planned",
  /**
   * Selects the `Hidden` case of {@link CampaignAvailability}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Hidden = "hidden"
}

/**
 * Defines the closed campaign content status value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignContentStatus = "skeleton" | "playable" | "complete";

/**
 * Defines the structured campaign artwork definition contract for this module. Its declared surface makes
 * desktop src, mobile src, alt, focal position explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignArtworkDefinition {
  /** Documents the desktop src member and its declared contract at this boundary. */
  desktopSrc: string;
  /**
   * Optional string mobile src carried by {@link CampaignArtworkDefinition}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  mobileSrc?: string;
  /**
   * string alt carried by {@link CampaignArtworkDefinition}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  alt: string;
  /**
   * string focal position carried by {@link CampaignArtworkDefinition}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  focalPosition: string;
}

/**
 * Defines the structured campaign mission definition contract for this module. Its declared surface makes id,
 * chapter id, order, title, faction explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionDefinition {
  /**
   * stable id used by {@link CampaignMissionDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id: CampaignMissionId;
  /**
   * stable chapter id used by {@link CampaignMissionDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  chapterId: CampaignChapterId;
  /**
   * numeric order carried by {@link CampaignMissionDefinition}. Its units and valid range are defined by {@link
   * CampaignMissionDefinition} and must remain consistent across producers and consumers.
   */
  order: number;
  /**
   * human-facing title for {@link CampaignMissionDefinition}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  title: string;
  /**
   * faction value carried by {@link CampaignMissionDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  faction: CampaignFaction;
  /**
   * discriminator for {@link CampaignMissionDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  contentType: CampaignContentType;
  /**
   * availability value carried by {@link CampaignMissionDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  availability: CampaignAvailability;
  /**
   * discriminator for {@link CampaignMissionDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  contentStatus: CampaignContentStatus;
  /**
   * collection value on {@link CampaignMissionDefinition}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  prerequisites: CampaignMissionId[];
  /**
   * string environment carried by {@link CampaignMissionDefinition}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  environment: string;
  /**
   * human-facing briefing for {@link CampaignMissionDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  briefing: string;
  /**
   * collection owned by {@link CampaignMissionDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  objectives: string[];
  /**
   * stable map key used by {@link CampaignMissionDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  mapKey: ProbableWaffleMapKey;
}

/**
 * Defines the structured campaign chapter definition contract for this module. Its declared surface makes id,
 * order, title, subtitle, summary explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignChapterDefinition {
  /**
   * stable id used by {@link CampaignChapterDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id: CampaignChapterId;
  /**
   * numeric order carried by {@link CampaignChapterDefinition}. Its units and valid range are defined by {@link
   * CampaignChapterDefinition} and must remain consistent across producers and consumers.
   */
  order: number;
  /**
   * human-facing title for {@link CampaignChapterDefinition}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  title: string;
  /**
   * human-facing subtitle for {@link CampaignChapterDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  subtitle: string;
  /**
   * human-facing summary for {@link CampaignChapterDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  summary: string;
  /**
   * presentation metadata for {@link CampaignChapterDefinition}. Rendering adapters consume it locally;
   * deterministic identity and behavior remain owned by the linked contract fields.
   */
  layout: CampaignMissionLayout;
  /**
   * presentation metadata for {@link CampaignChapterDefinition}. Rendering adapters consume it locally;
   * deterministic identity and behavior remain owned by the linked contract fields.
   */
  artwork: CampaignArtworkDefinition;
  /** Documents the mission artwork member and its declared contract at this boundary. */
  missionArtwork: CampaignArtworkDefinition;
  /**
   * collection value on {@link CampaignChapterDefinition}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  missions: CampaignMissionDefinition[];
}

/**
 * Defines the structured campaign catalog contract for this module. Its declared surface makes version,
 * chapters explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignCatalog {
  /**
   * compatibility version for {@link CampaignCatalog}. Consumers use it to choose validation, migration, or
   * conflict-handling rules instead of guessing the payload shape.
   */
  version: number;
  /**
   * collection value on {@link CampaignCatalog}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  chapters: CampaignChapterDefinition[];
}

/**
 * Defines the structured campaign mission completion contract for this module. Its declared surface makes
 * mission id, completed at explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionCompletion {
  /**
   * stable mission id used by {@link CampaignMissionCompletion} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  missionId: CampaignMissionId;
  /**
   * temporal value for {@link CampaignMissionCompletion}. It anchors ordering, expiry, or presentation timing
   * and must use the time domain declared by the enclosing contract.
   */
  completedAt: string;
}

/**
 * Defines the structured campaign progress data contract for this module. Its declared surface makes completed
 * missions explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignProgressData {
  /**
   * collection value on {@link CampaignProgressData}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  completedMissions: CampaignMissionCompletion[];
}

/**
 * Defines the closed campaign difficulty value set. Keeping this union named preserves exhaustive handling and
 * prevents incompatible free-form values at its boundaries.
 */
export type CampaignDifficulty = "story" | "normal" | "hard";

/**
 * Defines the structured campaign mission mastery contract for this module. Its declared surface makes first
 * completed at, completion count, best difficulty, best duration seconds, completed objective ids explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface CampaignMissionMastery {
  /**
   * temporal value for {@link CampaignMissionMastery}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  readonly firstCompletedAt: string;
  /**
   * numeric bound or quantity carried by {@link CampaignMissionMastery}. Interpret it in the owning contract’s
   * units and preserve its validation constraints at boundaries.
   */
  readonly completionCount: number;
  /**
   * best difficulty value carried by {@link CampaignMissionMastery}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly bestDifficulty: CampaignDifficulty;
  /**
   * Optional numeric best duration seconds carried by {@link CampaignMissionMastery}. Its units and valid range
   * are defined by {@link CampaignMissionMastery} and must remain consistent across producers and consumers.
   */
  readonly bestDurationSeconds?: number;
  /**
   * collection owned by {@link CampaignMissionMastery}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly completedObjectiveIds: readonly string[];
}

/**
 * Defines the campaign currency id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignCurrencyId = string;
/**
 * Defines the campaign hero id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignHeroId = string;
/**
 * Defines the campaign inventory item definition id alias used by this module. Keep values in this named
 * domain so linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignInventoryItemDefinitionId = string;
/**
 * Defines the campaign inventory item id alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignInventoryItemId = string;
/**
 * Defines the campaign loadout id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignLoadoutId = string;
/**
 * Defines the campaign progression upgrade id alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignProgressionUpgradeId = string;
/**
 * Defines the campaign reward claim id alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignRewardClaimId = string;
/**
 * Defines the campaign temporary boost id alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignTemporaryBoostId = string;
/**
 * Defines the campaign unlock id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignUnlockId = string;

/**
 * Defines the structured campaign wallet contract for this module. Its declared surface makes balances
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface CampaignWallet {
  /**
   * balances value carried by {@link CampaignWallet}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly balances: Readonly<Record<CampaignCurrencyId, number>>;
}

/**
 * Defines the structured campaign hero progress contract for this module. Its declared surface makes upgrade
 * ids, story skill unlock ids explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface CampaignHeroProgress {
  /**
   * collection owned by {@link CampaignHeroProgress}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
  /**
   * collection owned by {@link CampaignHeroProgress}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly storySkillUnlockIds: readonly CampaignUnlockId[];
}

/**
 * Defines the structured campaign faction progress contract for this module. Its declared surface makes
 * upgrade ids explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignFactionProgress {
  /**
   * collection owned by {@link CampaignFactionProgress}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
}

/**
 * Defines the structured campaign loadout contract for this module. Its declared surface makes id, name,
 * upgrade ids, unlock ids, inventory item ids explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignLoadout {
  /**
   * stable id used by {@link CampaignLoadout} to correlate this value with related records, events, or authored
   * content; it is not a display label.
   */
  readonly id: CampaignLoadoutId;
  /**
   * human-facing name for {@link CampaignLoadout}. It supports UI, narration, or diagnostics and must not be
   * used as the stable identity of the record.
   */
  readonly name: string;
  /**
   * collection owned by {@link CampaignLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
  /**
   * collection owned by {@link CampaignLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly unlockIds: readonly CampaignUnlockId[];
  /**
   * collection owned by {@link CampaignLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly inventoryItemIds: readonly CampaignInventoryItemId[];
}

/**
 * Defines the structured campaign inventory item contract for this module. Its declared surface makes id,
 * definition id, quantity, consumable explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignInventoryItem {
  /**
   * stable id used by {@link CampaignInventoryItem} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: CampaignInventoryItemId;
  /**
   * stable definition id used by {@link CampaignInventoryItem} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly definitionId: CampaignInventoryItemDefinitionId;
  /**
   * numeric quantity carried by {@link CampaignInventoryItem}. Its units and valid range are defined by {@link
   * CampaignInventoryItem} and must remain consistent across producers and consumers.
   */
  readonly quantity: number;
  /**
   * consumable value carried by {@link CampaignInventoryItem}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly consumable: boolean;
}

/** Defines the campaign progression profile contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface CampaignProgressionProfile {
  /**
   * compatibility schema version for {@link CampaignProgressionProfile}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * compatibility revision for {@link CampaignProgressionProfile}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly revision: number;
  /**
   * wallet value carried by {@link CampaignProgressionProfile}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly wallet: CampaignWallet;
  /**
   * collection owned by {@link CampaignProgressionProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly discoveredUpgradeIds: readonly CampaignProgressionUpgradeId[];
  /**
   * collection owned by {@link CampaignProgressionProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly permanentUpgradeIds: readonly CampaignProgressionUpgradeId[];
  /**
   * collection owned by {@link CampaignProgressionProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly purchasedUpgradeIds: readonly CampaignProgressionUpgradeId[];
  /**
   * collection owned by {@link CampaignProgressionProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly unlockIds: readonly CampaignUnlockId[];
  /**
   * hero progress value carried by {@link CampaignProgressionProfile}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly heroProgress: Readonly<Record<CampaignHeroId, CampaignHeroProgress>>;
  /**
   * faction progress value carried by {@link CampaignProgressionProfile}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly factionProgress: Readonly<Partial<Record<FactionType, CampaignFactionProgress>>>;
  /**
   * loadouts value carried by {@link CampaignProgressionProfile}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly loadouts: Readonly<Record<CampaignLoadoutId, CampaignLoadout>>;
  /**
   * collection value on {@link CampaignProgressionProfile}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly inventory: readonly CampaignInventoryItem[];
  /**
   * collection owned by {@link CampaignProgressionProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly rewardClaimIds: readonly CampaignRewardClaimId[];
}

/** Defines the campaign profile contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface CampaignProfile {
  /**
   * compatibility schema version for {@link CampaignProfile}. Consumers use it to choose validation, migration,
   * or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * progression value carried by {@link CampaignProfile}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly progression: CampaignProgressionProfile;
  /**
   * collection owned by {@link CampaignProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly activeLoadoutIds: readonly CampaignLoadoutId[];
  /**
   * collection owned by {@link CampaignProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly seenCinematicIds: readonly string[];
  /**
   * collection owned by {@link CampaignProfile}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly committedRunIds: readonly string[];
  /**
   * mission mastery value carried by {@link CampaignProfile}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly missionMastery: Readonly<Partial<Record<CampaignMissionId, CampaignMissionMastery>>>;
}

/**
 * Defines the structured campaign profile data contract for this module. Its declared surface makes profile,
 * completed missions explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignProfileData {
  /**
   * profile value carried by {@link CampaignProfileData}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly profile: CampaignProfile;
  /**
   * collection value on {@link CampaignProfileData}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly completedMissions: readonly CampaignMissionCompletion[];
}

export const CampaignProfileSyncState = {
  Guest: "guest",
  Loading: "loading",
  Synced: "synced",
  Pending: "pending",
  Error: "error"
} as const;
/**
 * Defines the campaign profile sync state alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignProfileSyncState = (typeof CampaignProfileSyncState)[keyof typeof CampaignProfileSyncState];

/**
 * Defines the structured campaign run start request contract for this module. Its declared surface makes run
 * id, mission id, mission revision, difficulty, base profile revision explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignRunStartRequest {
  /**
   * stable run id used by {@link CampaignRunStartRequest} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly runId: string;
  /**
   * stable mission id used by {@link CampaignRunStartRequest} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly missionId: CampaignMissionId;
  /**
   * compatibility mission revision for {@link CampaignRunStartRequest}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly missionRevision: number;
  /**
   * difficulty value carried by {@link CampaignRunStartRequest}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly difficulty: CampaignDifficulty;
  /**
   * compatibility base profile revision for {@link CampaignRunStartRequest}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly baseProfileRevision: number;
  /**
   * collection owned by {@link CampaignRunStartRequest}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly selectedLoadoutIds: readonly CampaignLoadoutId[];
  /**
   * string loadout snapshot hash carried by {@link CampaignRunStartRequest}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly loadoutSnapshotHash: string;
  /**
   * developer override value carried by {@link CampaignRunStartRequest}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly developerOverride: boolean;
}

/**
 * Defines the structured campaign profile update request contract for this module. Its declared surface makes
 * base profile revision, profile explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignProfileUpdateRequest {
  /**
   * compatibility base profile revision for {@link CampaignProfileUpdateRequest}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly baseProfileRevision: number;
  /**
   * profile value carried by {@link CampaignProfileUpdateRequest}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly profile: CampaignProfile;
}

/**
 * Defines the structured campaign profile merge request contract for this module. Its declared surface makes
 * profile, completed missions explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface CampaignProfileMergeRequest {
  /**
   * profile value carried by {@link CampaignProfileMergeRequest}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly profile: CampaignProfile;
  /**
   * collection value on {@link CampaignProfileMergeRequest}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly completedMissions: readonly CampaignMissionCompletion[];
}

/**
 * Defines the structured campaign victory commit response contract for this module. Its declared surface makes
 * profile owner id, result, profile data explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignVictoryCommitResponse {
  /** Documents the profile owner id member and its declared contract at this boundary. */
  readonly profileOwnerId: string;
  /**
   * result value carried by {@link CampaignVictoryCommitResponse}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly result: CampaignRewardCommitResult;
  /**
   * profile data value carried by {@link CampaignVictoryCommitResponse}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly profileData: CampaignProfileData;
}

/**
 * Defines the closed campaign progression modifier stat value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignProgressionModifierStat = "maximum-health" | "damage" | "armor" | "movement-speed" | "cooldown";

/**
 * Defines the structured campaign progression modifier contract for this module. Its declared surface makes
 * stat, value, scope explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignProgressionModifier {
  /**
   * temporal value for {@link CampaignProgressionModifier}. It anchors ordering, expiry, or presentation timing
   * and must use the time domain declared by the enclosing contract.
   */
  readonly stat: CampaignProgressionModifierStat;
  /**
   * operation value carried by {@link CampaignProgressionModifier}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly operation: "add" | "multiply";
  /**
   * numeric value carried by {@link CampaignProgressionModifier}. Its units and valid range are defined by
   * {@link CampaignProgressionModifier} and must remain consistent across producers and consumers.
   */
  readonly value: number;
  /**
   * Optional discriminator for {@link CampaignProgressionModifier}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly scope?:
    | { readonly kind: "global" }
    | { readonly kind: "faction"; readonly faction: FactionType }
    | { readonly kind: "actor"; readonly objectName: ObjectNames };
}

/**
 * Defines the structured campaign effective loadout contract for this module. Its declared surface makes
 * selected loadout ids, upgrade ids, unlock ids, inventory item ids, modifiers explicit to every consumer. Use
 * this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignEffectiveLoadout {
  /**
   * collection owned by {@link CampaignEffectiveLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly selectedLoadoutIds: readonly CampaignLoadoutId[];
  /**
   * collection owned by {@link CampaignEffectiveLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
  /**
   * collection owned by {@link CampaignEffectiveLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly unlockIds: readonly CampaignUnlockId[];
  /**
   * collection owned by {@link CampaignEffectiveLoadout}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly inventoryItemIds: readonly CampaignInventoryItemId[];
  /**
   * collection value on {@link CampaignEffectiveLoadout}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly modifiers: readonly CampaignProgressionModifier[];
  /**
   * unit level caps value carried by {@link CampaignEffectiveLoadout}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly unitLevelCaps: Readonly<Record<string, number>>;
  /**
   * collection value on {@link CampaignEffectiveLoadout}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly restrictionReasons: readonly string[];
}

/**
 * Defines the structured campaign mission progression snapshot contract for this module. Its declared surface
 * makes base profile revision, profile, effective loadout, temporary boost ids, pending reward ids explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface CampaignMissionProgressionSnapshot {
  /**
   * compatibility base profile revision for {@link CampaignMissionProgressionSnapshot}. Consumers use it to
   * choose validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly baseProfileRevision: number;
  /**
   * profile value carried by {@link CampaignMissionProgressionSnapshot}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly profile: CampaignProgressionProfile;
  /**
   * effective loadout value carried by {@link CampaignMissionProgressionSnapshot}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly effectiveLoadout: CampaignEffectiveLoadout;
  /**
   * collection owned by {@link CampaignMissionProgressionSnapshot}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly temporaryBoostIds: readonly CampaignTemporaryBoostId[];
  /**
   * collection owned by {@link CampaignMissionProgressionSnapshot}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly pendingRewardIds: readonly string[];
}

/**
 * Defines the structured campaign participant progression snapshot contract for this module. Its declared
 * surface makes slot id, player number, profile owner id, progression snapshot explicit to every consumer. Use
 * this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignParticipantProgressionSnapshot {
  /**
   * stable slot id used by {@link CampaignParticipantProgressionSnapshot} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly slotId: string;
  /**
   * numeric player number carried by {@link CampaignParticipantProgressionSnapshot}. Its units and valid range
   * are defined by {@link CampaignParticipantProgressionSnapshot} and must remain consistent across producers
   * and consumers.
   */
  readonly playerNumber: number;
  /**
   * Optional stable profile owner id used by {@link CampaignParticipantProgressionSnapshot} to correlate this
   * value with related records, events, or authored content; it is not a display label.
   */
  readonly profileOwnerId?: string;
  /**
   * progression snapshot value carried by {@link CampaignParticipantProgressionSnapshot}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  readonly progressionSnapshot: CampaignMissionProgressionSnapshot;
}

/**
 * Defines the structured mission run integrity state contract for this module. Its declared surface makes
 * eligible for rewards, invalidation reasons explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionRunIntegrityState {
  /**
   * boolean policy/value on {@link MissionRunIntegrityState} that explicitly controls whether the associated
   * behavior is active; do not infer it from unrelated state.
   */
  readonly eligibleForRewards: boolean;
  /**
   * collection value on {@link MissionRunIntegrityState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly invalidationReasons: readonly string[];
}

/**
 * Defines the structured campaign victory commit request contract for this module. Its declared surface makes
 * run id, mission id, mission revision, base profile revision, discovered reward ids explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface CampaignVictoryCommitRequest {
  /**
   * stable run id used by {@link CampaignVictoryCommitRequest} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly runId: string;
  /**
   * stable mission id used by {@link CampaignVictoryCommitRequest} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly missionId: CampaignMissionId;
  /**
   * compatibility mission revision for {@link CampaignVictoryCommitRequest}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly missionRevision: number;
  /**
   * compatibility base profile revision for {@link CampaignVictoryCommitRequest}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly baseProfileRevision: number;
  /**
   * collection owned by {@link CampaignVictoryCommitRequest}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly discoveredRewardIds: readonly string[];
  /**
   * collection owned by {@link CampaignVictoryCommitRequest}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly completedObjectiveIds: readonly string[];
  /**
   * Optional collection owned by {@link CampaignVictoryCommitRequest}. Preserve the declared element contract
   * and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly seenCinematicIds?: readonly string[];
  /**
   * difficulty value carried by {@link CampaignVictoryCommitRequest}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly difficulty: "story" | "normal" | "hard";
  /**
   * outcome value carried by {@link CampaignVictoryCommitRequest}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly outcome: CampaignMissionOutcome;
  /**
   * replay playback value carried by {@link CampaignVictoryCommitRequest}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly replayPlayback: boolean;
  /**
   * integrity value carried by {@link CampaignVictoryCommitRequest}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly integrity: MissionRunIntegrityState;
}

/**
 * Defines the closed campaign reward commit status value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignRewardCommitStatus = "committed" | "already-committed" | "rejected";

/**
 * Defines the structured campaign reward commit result contract for this module. Its declared surface makes
 * run id, status, profile, applied reward ids, skipped reward ids explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignRewardCommitResult {
  /**
   * stable run id used by {@link CampaignRewardCommitResult} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly runId: string;
  /**
   * discriminator for {@link CampaignRewardCommitResult}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignRewardCommitStatus;
  /**
   * profile value carried by {@link CampaignRewardCommitResult}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly profile: CampaignProgressionProfile;
  /**
   * collection owned by {@link CampaignRewardCommitResult}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly appliedRewardIds: readonly string[];
  /**
   * collection owned by {@link CampaignRewardCommitResult}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly skippedRewardIds: readonly string[];
  /**
   * collection value on {@link CampaignRewardCommitResult}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly warnings: readonly string[];
  /**
   * Optional string rejection reason carried by {@link CampaignRewardCommitResult}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly rejectionReason?: string;
}

/**
 * Defines the structured campaign temporary resource grant contract for this module. Its declared surface
 * makes resource type, amount explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface CampaignTemporaryResourceGrant {
  /**
   * discriminator for {@link CampaignTemporaryResourceGrant}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly resourceType: ResourceType;
  /**
   * numeric bound or quantity carried by {@link CampaignTemporaryResourceGrant}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly amount: number;
}

/**
 * Defines the structured campaign temporary unit grant contract for this module. Its declared surface makes
 * object name, count explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignTemporaryUnitGrant {
  /**
   * human-facing object name for {@link CampaignTemporaryUnitGrant}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly objectName: ObjectNames;
  /**
   * numeric bound or quantity carried by {@link CampaignTemporaryUnitGrant}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly count: number;
}

export const CampaignMissionOutcome = {
  Victory: "victory",
  Defeat: "defeat",
  Abandoned: "abandoned"
} as const;
/**
 * Defines the campaign mission outcome alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignMissionOutcome = (typeof CampaignMissionOutcome)[keyof typeof CampaignMissionOutcome];

/**
 * Defines the structured campaign mission result contract for this module. Its declared surface makes duration
 * seconds explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignMissionResult extends CampaignVictoryCommitRequest {
  /**
   * Optional numeric duration seconds carried by {@link CampaignMissionResult}. Its units and valid range are
   * defined by {@link CampaignMissionResult} and must remain consistent across producers and consumers.
   */
  durationSeconds?: number;
}

/**
 * Defines the closed campaign mission state value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionState = "locked" | "available" | "inProgress" | "completed" | "planned";

/**
 * Defines the structured campaign mission progress contract for this module. Its declared surface makes
 * mission, state, completed at explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionProgress {
  /**
   * mission value carried by {@link CampaignMissionProgress}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  mission: CampaignMissionDefinition;
  /**
   * discriminator for {@link CampaignMissionProgress}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  state: CampaignMissionState;
  /**
   * Optional temporal value for {@link CampaignMissionProgress}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  completedAt?: string;
}

export const GameSaveKind = {
  Manual: "manual",
  Autosave: "autosave",
  Quicksave: "quicksave",
  Archive: "archive"
} as const;
/**
 * Defines the game save kind alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type GameSaveKind = (typeof GameSaveKind)[keyof typeof GameSaveKind];

export const GameSaveScope = { Campaign: "campaign", Skirmish: "skirmish" } as const;
/**
 * Defines the game save scope alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type GameSaveScope = (typeof GameSaveScope)[keyof typeof GameSaveScope];

export const GameSaveSyncState = {
  Local: "local",
  Pending: "pending",
  Synced: "synced",
  Failed: "failed",
  Deleted: "deleted"
} as const;
/**
 * Defines the game save sync state alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type GameSaveSyncState = (typeof GameSaveSyncState)[keyof typeof GameSaveSyncState];

export const GAME_SAVE_FORMAT_VERSION = 3 as const;

/**
 * Defines the structured campaign game save context contract for this module. Its declared surface makes
 * campaign id, chapter id, mission id, run id, mission revision explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignGameSaveContext {
  /**
   * stable campaign id used by {@link CampaignGameSaveContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly campaignId: CampaignId;
  /**
   * stable chapter id used by {@link CampaignGameSaveContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly chapterId: CampaignChapterId;
  /**
   * stable mission id used by {@link CampaignGameSaveContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly missionId: CampaignMissionId;
  /**
   * stable run id used by {@link CampaignGameSaveContext} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly runId: string;
  /**
   * compatibility mission revision for {@link CampaignGameSaveContext}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly missionRevision: number;
  /**
   * compatibility runtime schema version for {@link CampaignGameSaveContext}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly runtimeSchemaVersion: number;
  /**
   * compatibility profile revision for {@link CampaignGameSaveContext}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly profileRevision: number;
  /**
   * Optional collection owned by {@link CampaignGameSaveContext}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly selectedLoadoutIds?: readonly CampaignLoadoutId[];
  /**
   * Optional string loadout snapshot hash carried by {@link CampaignGameSaveContext}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly loadoutSnapshotHash?: string;
  /**
   * Optional stable checkpoint id used by {@link CampaignGameSaveContext} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly checkpointId?: string;
  /**
   * numeric bound or quantity carried by {@link CampaignGameSaveContext}. Interpret it in the owning contract’s
   * units and preserve its validation constraints at boundaries.
   */
  readonly participantCount: number;
  /**
   * Optional collection value on {@link CampaignGameSaveContext}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly participantProgressionSnapshots?: readonly CampaignParticipantProgressionSnapshot[];
}

/**
 * This key is intentionally shipped in client code. It deters low-effort IndexedDB and network-payload editing;
 * it is not a security boundary because a determined user can recover it from the application bundle.
 */
export const PROBABLE_WAFFLE_SAVE_DATA_KEY = "9a8d43c1e775be105f326d8092cc92c9c13fe5d4162c62a94bd87d9ca7f2b160";

/** Defines the game save record contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface GameSaveRecord {
  /**
   * stable id used by {@link GameSaveRecord} to correlate this value with related records, events, or authored
   * content; it is not a display label.
   */
  id: string;
  /**
   * compatibility format version for {@link GameSaveRecord}. Consumers use it to choose validation, migration,
   * or conflict-handling rules instead of guessing the payload shape.
   */
  formatVersion: typeof GAME_SAVE_FORMAT_VERSION;
  /**
   * discriminator for {@link GameSaveRecord}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  scope: GameSaveScope;
  /**
   * discriminator for {@link GameSaveRecord}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  kind: GameSaveKind;
  /**
   * Optional human-facing name for {@link GameSaveRecord}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  name?: string;
  /**
   * temporal value for {@link GameSaveRecord}. It anchors ordering, expiry, or presentation timing and must use
   * the time domain declared by the enclosing contract.
   */
  createdAt: string;
  /**
   * temporal value for {@link GameSaveRecord}. It anchors ordering, expiry, or presentation timing and must use
   * the time domain declared by the enclosing contract.
   */
  updatedAt: string;
  /**
   * compatibility revision for {@link GameSaveRecord}. Consumers use it to choose validation, migration, or
   * conflict-handling rules instead of guessing the payload shape.
   */
  revision: number;
  /**
   * discriminator for {@link GameSaveRecord}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  syncState: GameSaveSyncState;
  /**
   * Optional campaign value carried by {@link GameSaveRecord}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign?: CampaignGameSaveContext;
  /**
   * Optional string thumbnail carried by {@link GameSaveRecord}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  thumbnail?: string;
  /**
   * game instance data value carried by {@link GameSaveRecord}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  gameInstanceData: ProbableWaffleGameInstanceData;
}

/** Defines the encoded game save record contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface EncodedGameSaveRecord extends Omit<GameSaveRecord, "gameInstanceData" | "formatVersion" | "campaign"> {
  /** Documents the format version member and its declared contract at this boundary. */
  formatVersion: number;
  /**
   * Optional collection value on {@link EncodedGameSaveRecord}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  campaign?: {
    /** Documents the campaign id member and its declared contract at this boundary. */
    campaignId?: CampaignId;
    /**
     * stable chapter id used by {@link EncodedGameSaveRecord} to correlate this value with related records,
     * events, or authored content; it is not a display label.
     */
    chapterId: CampaignChapterId;
    /**
     * stable mission id used by {@link EncodedGameSaveRecord} to correlate this value with related records,
     * events, or authored content; it is not a display label.
     */
    missionId: CampaignMissionId;
    /** Documents the mission revision member and its declared contract at this boundary. */
    missionRevision?: number;
    /**
     * stable run id used by {@link EncodedGameSaveRecord} to correlate this value with related records, events, or
     * authored content; it is not a display label.
     */
    runId: string;
    /**
     * Optional compatibility runtime schema version for {@link EncodedGameSaveRecord}. Consumers use it to choose
     * validation, migration, or conflict-handling rules instead of guessing the payload shape.
     */
    runtimeSchemaVersion?: number;
    /**
     * Optional compatibility profile revision for {@link EncodedGameSaveRecord}. Consumers use it to choose
     * validation, migration, or conflict-handling rules instead of guessing the payload shape.
     */
    profileRevision?: number;
    /**
     * Optional collection owned by {@link EncodedGameSaveRecord}. Preserve the declared element contract and any
     * ordering/uniqueness semantics when reading, serializing, or extending it.
     */
    selectedLoadoutIds?: readonly CampaignLoadoutId[];
    /**
     * Optional string loadout snapshot hash carried by {@link EncodedGameSaveRecord}. Treat it according to the
     * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
     */
    loadoutSnapshotHash?: string;
    /**
     * Optional stable checkpoint id used by {@link EncodedGameSaveRecord} to correlate this value with related
     * records, events, or authored content; it is not a display label.
     */
    checkpointId?: string;
    /**
     * Optional numeric bound or quantity carried by {@link EncodedGameSaveRecord}. Interpret it in the owning
     * contract’s units and preserve its validation constraints at boundaries.
     */
    participantCount?: number;
    /**
     * Optional collection value on {@link EncodedGameSaveRecord}. Its element type defines the records that may
     * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    participantProgressionSnapshots?: readonly CampaignParticipantProgressionSnapshot[];
  };
  /**
   * string encoded game instance data carried by {@link EncodedGameSaveRecord}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  encodedGameInstanceData: string;
}

/**
 * Defines the structured unsupported game save record contract for this module. Its declared surface makes
 * compatibility explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface UnsupportedGameSaveRecord extends Omit<EncodedGameSaveRecord, "encodedGameInstanceData"> {
  /**
   * collection value on {@link UnsupportedGameSaveRecord}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly compatibility: {
    /**
     * discriminator for {@link UnsupportedGameSaveRecord}. It selects the valid branch and behavior, so producers
     * and consumers must keep it synchronized with the accompanying fields.
     */
    readonly status: "unsupported";
    /**
     * string reason carried by {@link UnsupportedGameSaveRecord}. Treat it according to the owning contract’s
     * validation and presentation rules rather than assuming it is a stable identifier.
     */
    readonly reason: string;
    /**
     * collection value on {@link UnsupportedGameSaveRecord}. Its element type defines the records that may cross
     * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    readonly recoveryOptions: readonly ("earlier-autosave" | "restart-mission" | "export" | "delete")[];
  };
}

/**
 * Defines the closed game save list entry value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type GameSaveListEntry = GameSaveRecord | UnsupportedGameSaveRecord;

export function isSupportedGameSaveRecord(entry: GameSaveListEntry): entry is GameSaveRecord {
  return !("compatibility" in entry);
}
