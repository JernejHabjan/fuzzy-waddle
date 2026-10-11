/** Capture-local native ledger read, carried only in weak diagnostics. Tick equality cannot supply this authority. */
export interface AiResourceInputRead {
  readonly captureEpoch: number;
  readonly lossEpoch: number;
  readonly sequence: number;
  readonly playerNumber: number;
  readonly generation: number;
}
