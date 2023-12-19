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

  startLevel(gameCreate: ProbableWaffleGameCreate): void;

  openLevel(ProbableWaffleLevel: ProbableWaffleLevelEnum): void;

  openLevelSpectator(gameInstanceData: ProbableWaffleGameInstanceData): void;

  stopLevel(removeFrom: "local" | "localAndRemote"): Promise<void>;

  get gameInstanceId(): string | null;
}
