/** Synchronizes queued local saves without blocking offline save availability. */
export abstract class GameSaveSyncServiceInterface {
  abstract flush(): Promise<void>;
}
