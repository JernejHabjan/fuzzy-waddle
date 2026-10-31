export interface RuntimePageTickServiceV1 {
  currentTick: number;
  readonly tick$: { subscribe(callback: (tick: number) => void): { unsubscribe(): void } };
  setSimulationTimeScale(scale: number): void;
  pauseTick(reason: string): void;
  resumeTick(reason: string): void;
}
