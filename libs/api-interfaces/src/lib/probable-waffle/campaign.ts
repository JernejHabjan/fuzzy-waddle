import type { ProbableWaffleMapEnum } from "./probable-waffle";
import type { ProbableWaffleGameInstanceData } from "../game-instance/probable-waffle/game-instance";

/** Permanent identifiers used by progress, saves, routes, and campaign runs. */
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

export const CampaignMissionOutcome = {
  Victory: "victory",
  Defeat: "defeat",
  Abandoned: "abandoned"
} as const;
export type CampaignMissionOutcome = (typeof CampaignMissionOutcome)[keyof typeof CampaignMissionOutcome];

export interface CampaignMissionResult {
  runId: string;
  missionId: CampaignMissionId;
  outcome: CampaignMissionOutcome;
  durationSeconds?: number;
  completedObjectiveIds?: string[];
}

export type CampaignMissionState = "locked" | "available" | "inProgress" | "completed" | "planned";

export interface CampaignMissionProgress {
  mission: CampaignMissionDefinition;
  state: CampaignMissionState;
  completedAt?: string;
}

export const GameSaveKind = { Manual: "manual", Autosave: "autosave" } as const;
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

export const GAME_SAVE_FORMAT_VERSION = 1 as const;

/**
 * This key is intentionally shipped in client code. It deters low-effort IndexedDB and network-payload editing;
 * it is not a security boundary because a determined user can recover it from the application bundle.
 */
export const PROBABLE_WAFFLE_SAVE_DATA_KEY = "9a8d43c1e775be105f326d8092cc92c9c13fe5d4162c62a94bd87d9ca7f2b160";

/** Versioned replacement for the legacy name-keyed browser save shape. */
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
  campaign?: {
    chapterId: CampaignChapterId;
    missionId: CampaignMissionId;
    runId: string;
  };
  thumbnail?: string;
  gameInstanceData: ProbableWaffleGameInstanceData;
}

/** Wire/storage representation keeps the large game state encoded while retaining searchable save metadata. */
export interface EncodedGameSaveRecord extends Omit<GameSaveRecord, "gameInstanceData"> {
  encodedGameInstanceData: string;
}
