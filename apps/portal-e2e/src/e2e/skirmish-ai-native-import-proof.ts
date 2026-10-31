/** Compact native import results. Confidential captured payloads remain local to the browser harness. */
export interface NativeImportProof {
  readonly branch: string;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly capturedTick: number;
  readonly capturedManifestDigest: string;
  readonly capturedArtifactUnchanged: boolean;
  readonly attempts: readonly { readonly caseId: string; readonly result: string;
    readonly nativeWorldUnchanged: boolean; readonly injectedElements: number }[];
  readonly realPeerAccess?: { readonly humanClients: 2; readonly result: string;
    readonly captureResult: string;
    readonly nativeWorldUnchanged: boolean; readonly injectedElements: number };
}
