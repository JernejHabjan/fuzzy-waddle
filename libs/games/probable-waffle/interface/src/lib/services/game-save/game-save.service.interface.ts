import type { CampaignMissionId, GameSaveListEntry, GameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SaveGameRequest } from "./save-game-request";

/** Defines the game save service interface contract used by this module; its declared members form the compatible boundary for linked consumers. */
export abstract class GameSaveServiceInterface {
  abstract save(request: SaveGameRequest): Promise<GameSaveRecord>;
  abstract list(): Promise<GameSaveListEntry[]>;
  abstract continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined>;
  abstract rename(id: string, name: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract exportSave(id: string): Promise<string | undefined>;
}
