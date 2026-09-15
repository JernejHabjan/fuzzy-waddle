export interface RuntimePageTickServiceV1 {
  currentTick: number;
  setSimulationTimeScale(scale: number): void;
  pauseTick(reason: string): void;
  resumeTick(reason: string): void;
}
