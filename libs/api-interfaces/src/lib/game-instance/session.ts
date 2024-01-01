export enum GameSessionState {
  NotStarted,
  Starting = 0,
  WaitingToStart = 1,
  InProgress,
  EnteringScoreScreen,
  InScoreScreen,
  Stopped
}
