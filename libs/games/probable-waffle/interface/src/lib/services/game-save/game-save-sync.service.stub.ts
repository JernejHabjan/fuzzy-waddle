import { GameSaveSyncServiceInterface } from "./game-save-sync.service.interface";

/** Test replacement that records no external state. */
export class GameSaveSyncServiceStub extends GameSaveSyncServiceInterface {
  override async flush(): Promise<void> {}
}
