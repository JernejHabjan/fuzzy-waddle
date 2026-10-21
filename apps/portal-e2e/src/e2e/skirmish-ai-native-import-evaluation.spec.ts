import { nativeImportProofFailures } from "./skirmish-ai-native-import-evaluation";
import type { NativeImportProof } from "./skirmish-ai-native-import-proof";

const control = { caseId: "valid_control", result: "imported", nativeWorldUnchanged: true, injectedElements: 0 };
const base: NativeImportProof = { branch: "malformed", sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:01234567",
  capturedTick: 20, capturedManifestDigest: "actual-native-manifest", capturedArtifactUnchanged: true,
  attempts: [control, { ...control, caseId: "malformed", result: "malformed_json" }] };

it("requires the actual UI control, native state preservation and exact rejection", () => {
  expect(nativeImportProofFailures("malformed", base)).toEqual([]);
  for (const proof of [undefined, { ...base, capturedArtifactUnchanged: false }, { ...base, attempts: [] },
    { ...base, attempts: [control, { ...control, caseId: "malformed", result: "imported" }] },
    { ...base, attempts: base.attempts.map((attempt) => ({ ...attempt, nativeWorldUnchanged: false })) },
    { ...base, attempts: base.attempts.map((attempt) => ({ ...attempt, injectedElements: 1 })) }])
    expect(nativeImportProofFailures("malformed", proof).length).toBeGreaterThan(0);
});

it("requires both size limits and a real peer instead of borrowing ordinary parser rejection", () => {
  expect(nativeImportProofFailures("oversized", { ...base, branch: "oversized", attempts: [control,
    { ...control, caseId: "oversized_bytes", result: "oversized" }] }).length).toBeGreaterThan(0);
  expect(nativeImportProofFailures("unauthorized_peer", { ...base, branch: "unauthorized_peer", attempts: [control] }).length)
    .toBeGreaterThan(0);
  expect(nativeImportProofFailures("unauthorized_peer", { ...base, branch: "unauthorized_peer", attempts: [control],
    realPeerAccess: { humanClients: 2, result: "access_denied", captureResult: "runtime_capture_access_denied",
      nativeWorldUnchanged: true, injectedElements: 0 } })).toEqual([]);
});
