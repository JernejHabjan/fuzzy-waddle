/** Small result of real capture/offline work; full private payload stays local to the harness. */
export interface NativeDebugComparisonProof {
  readonly branch: string;
  readonly sourceRevision: string;
  readonly captureTick: number;
  readonly actualResultDigest: string;
  readonly replayResultDigest: string;
  readonly artifactBeforeDigest: string;
  readonly artifactAfterDigest: string;
  readonly nativeBeforeDigest: string;
  readonly nativeAfterDigest: string;
  readonly classification: string;
  readonly firstDifferencePath: string | null;
  readonly firstDifferenceExpected: unknown;
  readonly firstDifferenceActual: unknown;
}
