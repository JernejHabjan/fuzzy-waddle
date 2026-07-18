import type { ProbableWaffleGameInstanceData } from "../game-instance/probable-waffle/game-instance";
import type {
  CampaignChapterId,
  CampaignMissionId,
  GameSaveKind,
  GameSaveRecord,
  GameSaveScope
} from "./campaign";

/** Complete request required to create a local save record. */
export interface SaveGameRequest {
  scope: GameSaveScope;
  kind: GameSaveKind;
  name?: string;
  thumbnail?: string;
  gameInstanceData: ProbableWaffleGameInstanceData;
  /** Existing scoped manual save to replace while retaining its identity and original creation date. */
  overwriteSaveId?: GameSaveRecord["id"];
  campaign?: { chapterId: CampaignChapterId; missionId: CampaignMissionId; runId: string };
}
