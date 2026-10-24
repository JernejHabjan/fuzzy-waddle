/** Native scene shutdown with an outstanding original navigation Promise; never a replacement browser realm. */
export interface NativeDisposalEvidence {
  readonly pendingBeforeShutdown: boolean;
  readonly settledWithNull: boolean;
  readonly sceneInactive: boolean;
  readonly controllerDetached: boolean;
  readonly nativeCacheCleared: boolean;
}
