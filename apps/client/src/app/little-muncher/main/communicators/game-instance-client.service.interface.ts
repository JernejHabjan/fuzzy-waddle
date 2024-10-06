import {
  LittleMuncherGameCreate,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceData,
  LittleMuncherLevel
} from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceClientServiceInterface {
  gameInstance?: LittleMuncherGameInstance;

  startGame(): Promise<void>;

  stopGame(): void;

  /**
   * updates level on server and calls openLevel
   * @param gameCreate
   */
  startLevel(gameCreate: LittleMuncherGameCreate): void;

  /**
   * @private
   * Initializes game and opens level communicators
   */
  openLevel(littleMuncherLevel: LittleMuncherLevel): Promise<void>;

  openLevelSpectator(gameInstanceData: LittleMuncherGameInstanceData): Promise<void>;

  stopLevel(removeFrom: "local" | "localAndRemote"): Promise<void>;

  get gameInstanceId(): string | null;
}
