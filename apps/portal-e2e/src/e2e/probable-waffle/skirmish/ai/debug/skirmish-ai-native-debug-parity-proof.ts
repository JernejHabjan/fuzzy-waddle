/** Only bounded quota/disposal results leave the diagnostic scene; no captured world or incident payload is in this proof. */
export interface NativeDebugParityProof {
  readonly beforeDigest: string;
  readonly afterDigest: string;
  readonly accepted: number;
  readonly repeated: string;
  readonly rejected: boolean;
  readonly history: { readonly count: number; readonly firstSequence: number; readonly lastSequence: number;
    readonly missingThroughTick: number };
  readonly peak: {
    readonly sessionBytes: number;
    readonly quotaBytes: number;
    readonly retainedBytes: number;
    readonly retainedCount: number;
    readonly episodeCount: number;
    readonly disposed: boolean;
    readonly listenerDetached: boolean;
    readonly captureReleased: boolean;
  };
  readonly shutdown: NativeDebugParityProof["peak"];
}
