import {
  ProbableWaffleGameCreate,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleLevelEnum
} from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;

  startGame(): Promise<void>;

  stopGame(): void;

  /**
   * updates level on server and calls openLevel
   * @param gameCreate
   */
  startLevel(gameCreate: ProbableWaffleGameCreate): void;

  /**
   * @private
   * Initializes game and opens level communicators
   */
  openLevel(ProbableWaffleLevel: ProbableWaffleLevelEnum): void;

  openLevelSpectator(gameInstanceData: ProbableWaffleGameInstanceData): void;

  stopLevel(removeFrom: "local" | "localAndRemote"): Promise<void>;

  get gameInstanceId(): string | null;
}
