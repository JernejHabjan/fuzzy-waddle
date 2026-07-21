import type {
  CampaignArtworkDefinition,
  CampaignChapterId,
  CampaignId,
  CampaignMissionId,
  CampaignMissionLayout
} from "@fuzzy-waddle/probable-waffle-protocol";

export interface CampaignContentChapterDefinition {
  readonly id: CampaignChapterId;
  readonly order: number;
  readonly title: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly layout: CampaignMissionLayout;
  readonly artwork: CampaignArtworkDefinition;
  readonly missionArtwork: CampaignArtworkDefinition;
  readonly missionIds: readonly CampaignMissionId[];
}

export interface CampaignDefinition {
  readonly schemaVersion: 1;
  readonly id: CampaignId;
  readonly catalogueVersion: number;
  readonly chapters: readonly CampaignContentChapterDefinition[];
}
