import type { GameCommandExecution } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeRetentionWitnessAction } from "./skirmish-ai-native-retention-witness";
import type { readNativeRetentionBoundary } from "./skirmish-ai-native-retention-boundary";
import type { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import type { runNativeRetentionMultiplayer } from "./skirmish-ai-native-retention-multiplayer";

/** Original SP history, codec continuation and actual two-client pressure are distinct native evidence segments. */
export interface NativeRetentionProof {
  readonly branch: string;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly original: GameCommandExecution;
  readonly dispatchedCount: number;
  readonly uniqueDispatchedCount: number;
  readonly dispatchedDigest: string;
  readonly witness: Awaited<ReturnType<typeof nativeRetentionWitnessAction>>;
  readonly compacted: Awaited<ReturnType<typeof readNativeRetentionBoundary>>;
  readonly afterReplay: Awaited<ReturnType<typeof readNativeRetentionBoundary>>;
  readonly beforeEffects: string;
  readonly afterEffects: string;
  readonly beforeContinuation: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
  readonly afterContinuation: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
  readonly multiplayer?: Awaited<ReturnType<typeof runNativeRetentionMultiplayer>>;
  readonly save?: {
    readonly saveId: string;
    readonly revision: number;
    readonly sameRealm: boolean;
    readonly saved: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
    readonly restored: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
    readonly restoredAuthority: Awaited<ReturnType<typeof readNativeRetentionBoundary>>;
    readonly afterReplayAuthority: Awaited<ReturnType<typeof readNativeRetentionBoundary>>;
    readonly beforeEffects: string;
    readonly afterEffects: string;
    readonly afterReplayContinuation: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
    readonly resumed: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
    readonly resumedAuthority: Awaited<ReturnType<typeof readNativeRetentionBoundary>>;
    readonly resumedOriginalCharges: number;
    readonly resumedOriginalOutputs: number;
    readonly resumedCaptureDropped: boolean;
  };
}
