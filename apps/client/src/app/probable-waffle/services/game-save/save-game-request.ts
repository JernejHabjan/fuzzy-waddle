import type {
  CampaignChapterId,
  CampaignMissionId,
  GameSaveKind,
  GameSaveScope,
  ProbableWaffleGameInstanceData
} from "@fuzzy-waddle/api-interfaces";

/** Complete request required to create a local save record. */
export interface SaveGameRequest {
  scope: GameSaveScope;
  kind: GameSaveKind;
  name?: string;
  thumbnail?: string;
  gameInstanceData: ProbableWaffleGameInstanceData;
  campaign?: { chapterId: CampaignChapterId; missionId: CampaignMissionId; runId: string };
}
