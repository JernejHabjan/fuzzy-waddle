import type { ProbableWaffleMapEnum } from "./probable-waffle";
import type { ProbableWaffleGameInstanceData } from "../game-instance/probable-waffle/game-instance";
import type { FactionType } from "../game-instance/probable-waffle/player";
import type { ObjectNames } from "../game-instance/probable-waffle/object-names";
import type { ResearchType } from "../game-instance/probable-waffle/research-type";
import type { ResourceType } from "./resource-type-definition";

/** Permanent identifiers used by progress, saves, routes, and campaign runs. */
export type CampaignId = "ashes-of-the-ancients";
export type CampaignChapterId =
  | "prologue"
  | "two-homelands"
  | "crystal-war"
  | "united-against-volcano"
  | "the-betrayal";
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

/** Stable mission ownership keeps save and run context from pairing valid but unrelated IDs. */
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

/** Validates the stable chapter-to-mission relationship at API and storage boundaries. */
export function isCampaignMissionInChapter(chapterId: CampaignChapterId, missionId: CampaignMissionId): boolean {
  return CAMPAIGN_MISSION_CHAPTER.get(missionId) === chapterId;
}

export enum CampaignMissionLayout {
  Single = "single",
  Parallel = "parallel",
  Collision = "collision",
  United = "united",
  Finale = "finale"
}

export enum CampaignFaction {
  Tivara = "tivara",
  Skaduwee = "skaduwee",
  Both = "both",
  Switching = "switching"
}

export enum CampaignContentType {
  Mission = "mission",
  Cinematic = "cinematic"
}

export enum CampaignAvailability {
  Playable = "playable",
  Planned = "planned",
  Hidden = "hidden"
}

export type CampaignContentStatus = "skeleton" | "playable" | "complete";

export interface CampaignArtworkDefinition {
  /** Replaceable asset path; functional labels and controls are never part of the artwork. */
  desktopSrc: string;
  mobileSrc?: string;
  alt: string;
  focalPosition: string;
}

export interface CampaignMissionDefinition {
  id: CampaignMissionId;
  chapterId: CampaignChapterId;
  order: number;
  title: string;
  faction: CampaignFaction;
  contentType: CampaignContentType;
  availability: CampaignAvailability;
  contentStatus: CampaignContentStatus;
  prerequisites: CampaignMissionId[];
  environment: string;
  briefing: string;
  objectives: string[];
  mapId: ProbableWaffleMapEnum;
}

export interface CampaignChapterDefinition {
  id: CampaignChapterId;
  order: number;
  title: string;
  subtitle: string;
  summary: string;
  layout: CampaignMissionLayout;
  artwork: CampaignArtworkDefinition;
  /** Decorative background for the mission journey; it deliberately stays separate from the chapter-card art. */
  missionArtwork: CampaignArtworkDefinition;
  missions: CampaignMissionDefinition[];
}

export interface CampaignCatalog {
  version: number;
  chapters: CampaignChapterDefinition[];
}

export interface CampaignMissionCompletion {
  missionId: CampaignMissionId;
  completedAt: string;
}

export interface CampaignProgressData {
  completedMissions: CampaignMissionCompletion[];
}

export type CampaignDifficulty = "story" | "normal" | "hard";

export interface CampaignMissionMastery {
  readonly firstCompletedAt: string;
  readonly completionCount: number;
  readonly bestDifficulty: CampaignDifficulty;
  readonly bestDurationSeconds?: number;
  readonly completedObjectiveIds: readonly string[];
}

export type CampaignCurrencyId = string;
export type CampaignHeroId = string;
export type CampaignInventoryItemDefinitionId = string;
export type CampaignInventoryItemId = string;
export type CampaignLoadoutId = string;
export type CampaignProgressionUpgradeId = string;
export type CampaignRewardClaimId = string;
export type CampaignTemporaryBoostId = string;
export type CampaignUnlockId = string;

export interface CampaignWallet {
  readonly balances: Readonly<Record<CampaignCurrencyId, number>>;
}

export interface CampaignHeroProgress {
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
  readonly storySkillUnlockIds: readonly CampaignUnlockId[];
}

export interface CampaignFactionProgress {
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
}

export interface CampaignLoadout {
  readonly id: CampaignLoadoutId;
  readonly name: string;
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
  readonly unlockIds: readonly CampaignUnlockId[];
  readonly inventoryItemIds: readonly CampaignInventoryItemId[];
}

export interface CampaignInventoryItem {
  readonly id: CampaignInventoryItemId;
  readonly definitionId: CampaignInventoryItemDefinitionId;
  readonly quantity: number;
  readonly consumable: boolean;
}

/** Profile-owned progression. Mission runs receive an immutable launch snapshot instead of this live object. */
export interface CampaignProgressionProfile {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly wallet: CampaignWallet;
  readonly discoveredUpgradeIds: readonly CampaignProgressionUpgradeId[];
  readonly permanentUpgradeIds: readonly CampaignProgressionUpgradeId[];
  readonly purchasedUpgradeIds: readonly CampaignProgressionUpgradeId[];
  readonly unlockIds: readonly CampaignUnlockId[];
  readonly heroProgress: Readonly<Record<CampaignHeroId, CampaignHeroProgress>>;
  readonly factionProgress: Readonly<Partial<Record<FactionType, CampaignFactionProgress>>>;
  readonly loadouts: Readonly<Record<CampaignLoadoutId, CampaignLoadout>>;
  readonly inventory: readonly CampaignInventoryItem[];
  readonly rewardClaimIds: readonly CampaignRewardClaimId[];
}

/** One durable account or guest profile; progression remains reusable by the deterministic reward resolver. */
export interface CampaignProfile {
  readonly schemaVersion: 1;
  readonly progression: CampaignProgressionProfile;
  readonly activeLoadoutIds: readonly CampaignLoadoutId[];
  readonly seenCinematicIds: readonly string[];
  readonly committedRunIds: readonly string[];
  readonly missionMastery: Readonly<Partial<Record<CampaignMissionId, CampaignMissionMastery>>>;
}

export interface CampaignProfileData {
  readonly profile: CampaignProfile;
  readonly completedMissions: readonly CampaignMissionCompletion[];
}

export const CampaignProfileSyncState = {
  Guest: "guest",
  Loading: "loading",
  Synced: "synced",
  Pending: "pending",
  Error: "error"
} as const;
export type CampaignProfileSyncState = (typeof CampaignProfileSyncState)[keyof typeof CampaignProfileSyncState];

export interface CampaignRunStartRequest {
  readonly runId: string;
  readonly missionId: CampaignMissionId;
  readonly missionRevision: number;
  readonly difficulty: CampaignDifficulty;
  readonly baseProfileRevision: number;
  readonly selectedLoadoutIds: readonly CampaignLoadoutId[];
  readonly loadoutSnapshotHash: string;
  readonly developerOverride: boolean;
}

export interface CampaignProfileUpdateRequest {
  readonly baseProfileRevision: number;
  readonly profile: CampaignProfile;
}

export interface CampaignProfileMergeRequest {
  readonly profile: CampaignProfile;
  readonly completedMissions: readonly CampaignMissionCompletion[];
}

export interface CampaignVictoryCommitResponse {
  readonly result: CampaignRewardCommitResult;
  readonly profileData: CampaignProfileData;
}

export type CampaignProgressionModifierStat =
  | "maximum-health"
  | "damage"
  | "armor"
  | "movement-speed"
  | "cooldown";

export interface CampaignProgressionModifier {
  readonly stat: CampaignProgressionModifierStat;
  readonly operation: "add" | "multiply";
  readonly value: number;
  readonly scope?:
    | { readonly kind: "global" }
    | { readonly kind: "faction"; readonly faction: FactionType }
    | { readonly kind: "actor"; readonly objectName: ObjectNames };
}

export interface CampaignEffectiveLoadout {
  readonly selectedLoadoutIds: readonly CampaignLoadoutId[];
  readonly upgradeIds: readonly CampaignProgressionUpgradeId[];
  readonly unlockIds: readonly CampaignUnlockId[];
  readonly inventoryItemIds: readonly CampaignInventoryItemId[];
  readonly modifiers: readonly CampaignProgressionModifier[];
  readonly unitLevelCaps: Readonly<Record<string, number>>;
  readonly restrictionReasons: readonly string[];
}

export interface CampaignMissionProgressionSnapshot {
  readonly baseProfileRevision: number;
  readonly profile: CampaignProgressionProfile;
  readonly effectiveLoadout: CampaignEffectiveLoadout;
  readonly temporaryBoostIds: readonly CampaignTemporaryBoostId[];
  readonly pendingRewardIds: readonly string[];
}

export interface MissionRunIntegrityState {
  readonly eligibleForRewards: boolean;
  readonly invalidationReasons: readonly string[];
}

export interface CampaignVictoryCommitRequest {
  readonly runId: string;
  readonly missionId: CampaignMissionId;
  readonly missionRevision: number;
  readonly baseProfileRevision: number;
  readonly discoveredRewardIds: readonly string[];
  readonly completedObjectiveIds: readonly string[];
  readonly seenCinematicIds?: readonly string[];
  readonly difficulty: "story" | "normal" | "hard";
  readonly outcome: CampaignMissionOutcome;
  readonly replayPlayback: boolean;
  readonly integrity: MissionRunIntegrityState;
}

export type CampaignRewardCommitStatus = "committed" | "already-committed" | "rejected";

export interface CampaignRewardCommitResult {
  readonly runId: string;
  readonly status: CampaignRewardCommitStatus;
  readonly profile: CampaignProgressionProfile;
  readonly appliedRewardIds: readonly string[];
  readonly skippedRewardIds: readonly string[];
  readonly warnings: readonly string[];
  readonly rejectionReason?: string;
}

export interface CampaignTemporaryResourceGrant {
  readonly resourceType: ResourceType;
  readonly amount: number;
}

export interface CampaignTemporaryUnitGrant {
  readonly objectName: ObjectNames;
  readonly count: number;
}

export const CampaignMissionOutcome = {
  Victory: "victory",
  Defeat: "defeat",
  Abandoned: "abandoned"
} as const;
export type CampaignMissionOutcome = (typeof CampaignMissionOutcome)[keyof typeof CampaignMissionOutcome];

export interface CampaignMissionResult extends CampaignVictoryCommitRequest {
  durationSeconds?: number;
}

export type CampaignMissionState = "locked" | "available" | "inProgress" | "completed" | "planned";

export interface CampaignMissionProgress {
  mission: CampaignMissionDefinition;
  state: CampaignMissionState;
  completedAt?: string;
}

export const GameSaveKind = {
  Manual: "manual",
  Autosave: "autosave",
  Quicksave: "quicksave",
  Archive: "archive"
} as const;
export type GameSaveKind = (typeof GameSaveKind)[keyof typeof GameSaveKind];

export const GameSaveScope = { Campaign: "campaign", Skirmish: "skirmish" } as const;
export type GameSaveScope = (typeof GameSaveScope)[keyof typeof GameSaveScope];

export const GameSaveSyncState = {
  Local: "local",
  Pending: "pending",
  Synced: "synced",
  Failed: "failed",
  Deleted: "deleted"
} as const;
export type GameSaveSyncState = (typeof GameSaveSyncState)[keyof typeof GameSaveSyncState];

export const GAME_SAVE_FORMAT_VERSION = 3 as const;

export interface CampaignGameSaveContext {
  readonly campaignId: CampaignId;
  readonly chapterId: CampaignChapterId;
  readonly missionId: CampaignMissionId;
  readonly runId: string;
  readonly missionRevision: number;
  readonly runtimeSchemaVersion: number;
  readonly profileRevision: number;
  readonly selectedLoadoutIds?: readonly CampaignLoadoutId[];
  readonly loadoutSnapshotHash?: string;
  readonly checkpointId?: string;
  readonly participantCount: number;
}

/**
 * This key is intentionally shipped in client code. It deters low-effort IndexedDB and network-payload editing;
 * it is not a security boundary because a determined user can recover it from the application bundle.
 */
export const PROBABLE_WAFFLE_SAVE_DATA_KEY = "9a8d43c1e775be105f326d8092cc92c9c13fe5d4162c62a94bd87d9ca7f2b160";

/** Versioned browser save shape. */
export interface GameSaveRecord {
  id: string;
  formatVersion: typeof GAME_SAVE_FORMAT_VERSION;
  scope: GameSaveScope;
  kind: GameSaveKind;
  name?: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  syncState: GameSaveSyncState;
  campaign?: CampaignGameSaveContext;
  thumbnail?: string;
  gameInstanceData: ProbableWaffleGameInstanceData;
}

/** Wire/storage representation keeps the large game state encoded while retaining searchable save metadata. */
export interface EncodedGameSaveRecord extends Omit<GameSaveRecord, "gameInstanceData" | "formatVersion" | "campaign"> {
  /** Repository records may predate the current decoder and remain listable for recovery/export. */
  formatVersion: number;
  campaign?: {
    /** Absent only on legacy format-v1 campaign saves created before content identity was versioned. */
    campaignId?: CampaignId;
    chapterId: CampaignChapterId;
    missionId: CampaignMissionId;
    /** Absent only on legacy format-v1 campaign saves; migration policy is owned by campaign save restore. */
    missionRevision?: number;
    runId: string;
    runtimeSchemaVersion?: number;
    profileRevision?: number;
    selectedLoadoutIds?: CampaignLoadoutId[];
    loadoutSnapshotHash?: string;
    checkpointId?: string;
    participantCount?: number;
  };
  encodedGameInstanceData: string;
}

export interface UnsupportedGameSaveRecord
  extends Omit<EncodedGameSaveRecord, "encodedGameInstanceData"> {
  readonly compatibility: {
    readonly status: "unsupported";
    readonly reason: string;
    readonly recoveryOptions: readonly ("earlier-autosave" | "restart-mission" | "export" | "delete")[];
  };
}

export type GameSaveListEntry = GameSaveRecord | UnsupportedGameSaveRecord;

export function isSupportedGameSaveRecord(entry: GameSaveListEntry): entry is GameSaveRecord {
  return !("compatibility" in entry);
}
