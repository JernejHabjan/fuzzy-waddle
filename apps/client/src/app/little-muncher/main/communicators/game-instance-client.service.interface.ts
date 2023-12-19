import {
  LittleMuncherGameCreate,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceData,
  LittleMuncherLevel
} from '@fuzzy-waddle/api-interfaces';

export interface GameInstanceClientServiceInterface {
  gameInstance?: LittleMuncherGameInstance;

  startGame(): Promise<void>;

  stopGame(): void;

  startLevel(gameCreate: LittleMuncherGameCreate): void;

  openLevel(littleMuncherLevel: LittleMuncherLevel): void;

  openLevelSpectator(gameInstanceData: LittleMuncherGameInstanceData): void;

  stopLevel(removeFrom: 'local' | 'localAndRemote'): Promise<void>;

  get gameInstanceId(): string | null;
}
