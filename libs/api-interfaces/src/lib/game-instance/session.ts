export enum GameSessionState {
  NotStarted,
  EnteringMap = 0,
  WaitingToStart = 1,
  InProgress,
  Paused,
  BeforeFinished,
  Finished
}
