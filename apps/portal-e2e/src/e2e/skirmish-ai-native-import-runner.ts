import type { Browser } from "@playwright/test";
import type { AiRuntimeDecisionRepro } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-decision-repro";
import type { AiRuntimeReproArtifactV1, AiRuntimeReproProvenanceV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-scenario-bridge";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import type { NativeImportProof } from "./skirmish-ai-native-import-proof";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { armNativeDebugComparison } from "./skirmish-ai-native-debug-comparison";
import { importThroughNativeUi } from "./skirmish-ai-native-import-ui";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";

/** Capture a real native artifact and import through the actual developer UI; never advertise import as replay. */
export async function runNativeImportVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string
) {
  let nativeImport: NativeImportProof | undefined;
  let artifactJson: string | undefined;
  let captureProvenance: AiRuntimeReproProvenanceV1 | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, async (page, index, checkpoint) => {
      if (index === -1) { await armNativeDebugComparison(page); return; }
      if (index !== 0 || !checkpoint) return;
      const selected = await page.evaluate(() => (window as unknown as {
        __nativeDebugComparisonCapture?: AiRuntimeDecisionRepro }).__nativeDebugComparisonCapture);
      if (!selected) throw new Error("native_import_selected_provenance_missing");
      const provenance: AiRuntimeReproProvenanceV1 = {
        sourceRevision: request.sourceRevision, dirtySourceDigest: request.dirtySourceDigest,
        mapId: variant.mapLabel ?? fixture.recipe.mapLabel, mapDigest: digestCanonicalAiValue(selected.payload.observation.map ?? null),
        contentDigest: digestCanonicalAiValue(selected.catalog), configVersion: selected.profile.profileVersion,
        profileVersion: selected.profile.profileVersion, archetypeVersion: selected.profile.archetypeVersion,
        difficulty: selected.profile.difficulty, rulesVersion: "skirmish-ai-v1", scenarioId: "DBG-05" };
      captureProvenance = provenance;
      const artifact = await page.evaluate(async ({ provenance, tick }) => {
        const host = window.__fuzzyWaddleAiRuntimeBrowserTestV1;
        if (!host?.captureRuntimeArtifact) throw new Error("native_runtime_artifact_entry_missing");
        return host.captureRuntimeArtifact(2, tick, provenance);
      }, { provenance, tick: checkpoint.tick });
      const originalDigest = digestCanonicalAiValue(artifact);
      artifactJson = JSON.stringify(artifact);
      const attempts: { caseId: string; result: string; nativeWorldUnchanged: boolean; injectedElements: number }[] = [];
      attempts.push({ caseId: "valid_control", ...await importThroughNativeUi(page, artifactJson) });
      for (const [caseId, json] of importMutations(branch, artifact))
        attempts.push({ caseId, ...await importThroughNativeUi(page, json) });
      nativeImport = { branch, sourceRevision: request.sourceRevision, fixtureDigest: request.fixtureDigest,
        capturedTick: artifact.manifest.replayInputs.tick, capturedManifestDigest: digestCanonicalAiValue(artifact.manifest),
        capturedArtifactUnchanged: originalDigest === digestCanonicalAiValue(artifact), attempts };
    }, async () => {
      if (branch !== "unauthorized_peer") return;
      if (process.env.AI_MULTIPLAYER_E2E !== "1") throw new Error("native_import_requires_real_peer_driver");
      const match = await startMultiplayerTestMatch(browser, { runtimeImport: true,
        seed: request.seed ?? variant.seed, aiFaction: variant.aiFaction, aiDifficulty: variant.difficulty });
      try {
        await match.peer.locator("[data-ai-runtime-bundle-import]").waitFor();
        const peer = await observeMultiplayerPeer(match.peer, 3);
        if (new Set(peer.relay.humanPlayerNumbers).size !== 2 || peer.relay.localPlayerNumber !== 2 ||
            peer.aiControllerPresent || !artifactJson || !nativeImport || !captureProvenance)
          throw new Error("native_host_import_or_real_peer_proof_missing");
        const denied = await importThroughNativeUi(match.peer, artifactJson);
        const captureResult = await match.peer.evaluate(async (provenance) => {
          const host = (window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: {
            captureRuntimeArtifact?: (player: number, tick: number, provenance: AiRuntimeReproProvenanceV1) => Promise<unknown>
          } }).__fuzzyWaddleAiMultiplayerBrowserTestV1;
          if (!host?.captureRuntimeArtifact) throw new Error("native_peer_capture_entry_missing");
          try { await host.captureRuntimeArtifact(3, 0, provenance); return "unexpectedly_allowed"; }
          catch (error) { return error instanceof Error ? error.message : String(error); }
        }, captureProvenance);
        nativeImport = { ...nativeImport, realPeerAccess: { humanClients: 2, captureResult, ...denied } };
      } finally { await match.dispose(); }
    }, async (page) => {
      await page.addInitScript(() => sessionStorage.setItem("fuzzy-waddle:ai-runtime-import-v1", "1"));
    });
  if (!nativeImport) throw new Error("native_import_not_captured");
  return { ...result, nativeImport };
}

function importMutations(branch: string, artifact: AiRuntimeReproArtifactV1): [string, string][] {
  let copy = structuredClone(artifact);
  if (branch === "malformed") return [["malformed", "{"]];
  if (branch === "version_mismatch") copy = { ...copy, manifest: {
    ...copy.manifest, schemaVersion: 2 } as unknown as typeof copy.manifest };
  if (branch === "traversal") copy = { ...copy, manifest: { ...copy.manifest, replayInputs: { ...copy.manifest.replayInputs,
    snapshotReference: "../outside-capture.json" } } };
  if (branch === "html") copy = { ...copy, manifest: { ...copy.manifest, display: { label: "<img src=x onerror=alert(1)>" } } };
  if (branch === "oversized") return [["oversized_bytes", " ".repeat(16 * 1024 * 1024 + 1)],
    ["oversized_count", JSON.stringify({ ...copy, payload: { ...copy.payload, outcomes: Array(4097).fill(null) } })]];
  return branch === "unauthorized_peer" ? [] : [[branch, JSON.stringify(copy)]];
}
