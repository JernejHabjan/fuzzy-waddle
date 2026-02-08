import {
  type LittleMuncherGameCreate,
  LittleMuncherGameInstance,
  type LittleMuncherGameInstanceData,
  type LittleMuncherLevel
} from "@fuzzy-waddle/api-interfaces";
import type { WritableSignal } from "@angular/core";

export interface GameInstanceClientServiceInterface {
  gameInstance: WritableSignal<LittleMuncherGameInstance | undefined>;

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
