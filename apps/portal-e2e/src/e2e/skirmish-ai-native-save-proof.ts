import type { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import type { closeNativeDecisionTrace } from "./skirmish-ai-native-decision-trace";
import type { nativeSavePremises } from "./skirmish-ai-native-save-premises";

/** Original match and restored continuation are separate segments; native tick histories are never concatenated. */
export interface NativeSaveProof {
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly branch: string;
  readonly premises: ReturnType<typeof nativeSavePremises>;
  readonly sameRealm: boolean;
  readonly saveId: string;
  readonly saveRevision: number;
  readonly resumedSimulationTimeScale: number;
  readonly saved: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
  readonly restored: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
  readonly control: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
  readonly resumed: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
  readonly controlTraceCount: number;
  readonly resumedTraceCount: number;
  readonly controlTraceDigest: string;
  readonly resumedTraceDigest: string;
  readonly traceOverflow: boolean;
  readonly restoreWorldDifferences: readonly import("./skirmish-ai-native-world-projection-diff").NativeDebugProjectionDifference[];
  readonly firstTraceInputDifferences: readonly import("./skirmish-ai-native-world-projection-diff").NativeDebugProjectionDifference[];
  readonly firstDivergentTraceInputDifferences: readonly import("./skirmish-ai-native-world-projection-diff").NativeDebugProjectionDifference[];
  readonly firstDivergentActors: readonly {
    readonly index: number;
    readonly control: unknown;
    readonly resumed: unknown;
  }[];
  readonly resumedUsefulWork: {
    readonly tick: number;
    readonly advancedQueueAttempts: number;
    readonly completedQueueItems: number;
    readonly nativeDamageEvents: number;
  };
  readonly firstTraceDifference: { readonly index: number;
    readonly control: Awaited<ReturnType<typeof closeNativeDecisionTrace>>["records"][number] | null;
    readonly resumed: Awaited<ReturnType<typeof closeNativeDecisionTrace>>["records"][number] | null } | null;
  readonly navigationDiagnostics?: {
    readonly saved: import("./skirmish-ai-native-save-navigation-diagnostics").NativeSaveNavigationSummary;
    readonly restored: import("./skirmish-ai-native-save-navigation-diagnostics").NativeSaveNavigationSummary;
    readonly randomCalls: readonly import("./skirmish-ai-native-save-navigation-diagnostics").NativeSaveRandomCall[];
    readonly changedCells: readonly {
      readonly x: number;
      readonly y: number;
      readonly terrainBefore: number;
      readonly terrainAfter: number;
      readonly objectBefore: number | null;
      readonly objectAfter: number | null;
      readonly navigationBefore: number;
      readonly navigationAfter: number;
    }[];
    readonly affectedColliders: {
      readonly saved: readonly import("./skirmish-ai-native-save-navigation-diagnostics").NativeSaveColliderFootprint[];
      readonly restored: readonly import("./skirmish-ai-native-save-navigation-diagnostics").NativeSaveColliderFootprint[];
    };
  };
}
