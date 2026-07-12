import type { ProbableWaffleMapEnum } from "./probable-waffle";

/** Permanent identifiers used by progress, saves, routes, and campaign runs. */
export type CampaignChapterId = string;
export type CampaignMissionId = string;

export type CampaignMissionLayout = "single" | "parallel" | "collision" | "united" | "finale";
export type CampaignFaction = "tivara" | "skaduwee" | "both" | "switching";
export type CampaignContentType = "mission" | "cinematic";
export type CampaignAvailability = "playable" | "planned" | "hidden";

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
  mapId?: ProbableWaffleMapEnum;
}

export interface CampaignChapterDefinition {
  id: CampaignChapterId;
  order: number;
  title: string;
  subtitle: string;
  summary: string;
  layout: CampaignMissionLayout;
  artwork: CampaignArtworkDefinition;
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

export type CampaignMissionState = "locked" | "available" | "inProgress" | "completed" | "planned";

export interface CampaignMissionProgress {
  mission: CampaignMissionDefinition;
  state: CampaignMissionState;
  completedAt?: string;
}
