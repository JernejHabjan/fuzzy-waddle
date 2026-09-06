/** True when an identity is at or behind the persisted applied-command frontier. */
export function isProcessedCommandSequence(sequence: number, processedSequenceWatermark: number): boolean {
  return sequence <= processedSequenceWatermark;
}

/** Advances a player frontier monotonically after deterministic application admission. */
export function advanceProcessedCommandSequence(
  processedSequenceWatermark: number,
  sequence: number
): number {
  return Math.max(processedSequenceWatermark, sequence);
}
