export interface DeterministicRandomState {
  readonly schemaVersion: 1;
  readonly generatorState: string;
  readonly operationCount: number;
}
