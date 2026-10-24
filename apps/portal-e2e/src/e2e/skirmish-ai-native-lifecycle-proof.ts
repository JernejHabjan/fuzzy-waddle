import type { readNativeSceneOwnership } from "./skirmish-ai-native-scene-ownership";
import type { deliverRetainedNativeSceneWork } from "./skirmish-ai-native-retained-work";

export interface NativeLifecycleProof {
  readonly branch: string;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly original: Awaited<ReturnType<typeof readNativeSceneOwnership>>;
  readonly nextInitial: Awaited<ReturnType<typeof readNativeSceneOwnership>>;
  readonly nextActive: Awaited<ReturnType<typeof readNativeSceneOwnership>>;
  readonly nativeBeforeLateWork: string;
  readonly nativeAfterLateWork: string;
  readonly nextAiErrors: readonly string[];
  readonly retained: Awaited<ReturnType<typeof deliverRetainedNativeSceneWork>>;
  readonly promotedEpoch?: number;
  readonly originalEpoch?: number;
  readonly retainedAuthorityUnchanged?: boolean;
}
