import type { CampaignMissionId, GameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SaveGameRequest } from "./save-game-request";

/** Public save operations used by campaign, menus, and the game communicator. */
export abstract class GameSaveServiceInterface {
  abstract save(request: SaveGameRequest): Promise<GameSaveRecord>;
  abstract list(): Promise<GameSaveRecord[]>;
  abstract continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined>;
  abstract rename(id: string, name: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
