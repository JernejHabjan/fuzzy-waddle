import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { AiRuntimeDecisionRepro } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-decision-repro";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { StateHashService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/recovery/state-hash.service";
import { captureAiDecisionBundleV1, compareAiDecisionBundlesV1, replayAiDecisionBundleV1,
  runAiOfflineWhatIfV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-repro-runner-v1";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import { nativeReproBrain } from "./skirmish-ai-native-repro-brain";
import type { NativeDebugComparisonProof } from "./skirmish-ai-native-debug-comparison-proof";

/** One actual first selected boundary; the listener removes itself before another large payload could be retained. */
export async function armNativeDebugComparison(page: Page) {
  await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __nativeDebugComparisonCapture?: AiRuntimeDecisionRepro };
    const scene = realm.__fuzzyWaddleAiRuntimeBrowserTestV1?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key.startsWith("Map"));
    if (!scene) throw new Error("debug_comparison_native_scene_missing");
    const capture = (value: AiRuntimeDecisionRepro) => { realm.__nativeDebugComparisonCapture = value; };
    scene.events.once("ai-runtime-decision-repro", capture);
    scene.events.once("shutdown", () => {
      scene.events.off("ai-runtime-decision-repro", capture);
      delete realm.__nativeDebugComparisonCapture;
    });
  });
}

/** Pure comparison uses actual native input but never applies a hypothetical result to the paused original scene. */
export async function captureNativeDebugComparison(
  page: Page, branch: string, sourceRevision: string, dirtySourceDigest: string | null
): Promise<NativeDebugComparisonProof> {
  const capture = await page.evaluate(() => (window as unknown as {
    __nativeDebugComparisonCapture?: AiRuntimeDecisionRepro }).__nativeDebugComparisonCapture);
  if (!capture?.payload.expectedResult) throw new Error("debug_comparison_actual_selected_capture_missing");
  const before = await nativeDebugWorldDigest(page), payload = capture.payload;
  const artifact = captureAiDecisionBundleV1(payload, { sourceRevision, dirtySourceDigest,
    mapId: "AI Open Economy (test only)", mapDigest: digestCanonicalAiValue(payload.observation.map ?? null),
    contentDigest: digestCanonicalAiValue(capture.catalog), configVersion: capture.profile.profileVersion,
    profileVersion: capture.profile.profileVersion, archetypeVersion: capture.profile.archetypeVersion,
    difficulty: capture.profile.difficulty, faction: payload.observation.faction, playerNumber: payload.observation.playerNumber,
    rulesVersion: "skirmish-ai-v1", tickInterval: 50, authorityEpoch: payload.priorState.authority.authorityEpoch,
    tick: payload.observation.tick, expectedCheckpoints: [], scenarioId: "DBG-04" }, "Actual selected native decision");
  const artifactBeforeDigest = digestCanonicalAiValue(artifact);
  const replay = replayAiDecisionBundleV1(artifact, nativeReproBrain(capture), artifact.manifest.replayInputs);
  if (replay.status !== "reproduced") throw new Error(`debug_comparison_replay_blocked:${replay.blocker}`);
  let candidate = structuredClone(artifact);
  if (branch === "changed_input") {
    const changedObservation = { ...candidate.payload.observation, tick: candidate.payload.observation.tick + 1 };
    candidate = { ...candidate, payload: { ...candidate.payload, observation: changedObservation },
      manifest: { ...candidate.manifest, replayInputs: { ...candidate.manifest.replayInputs,
        inputDigest: digestCanonicalAiValue({ observation: changedObservation, outcomes: candidate.payload.outcomes }) } } };
  }
  if (branch === "changed_config") candidate = { ...candidate, manifest: { ...candidate.manifest,
    replayInputs: { ...candidate.manifest.replayInputs, configVersion: "controlled-different-config" } } };
  const expectedResult = candidate.payload.expectedResult;
  if (branch === "same_input_divergence" && expectedResult) candidate = { ...candidate,
    payload: { ...candidate.payload, expectedResult: { ...expectedResult, nextState: { ...expectedResult.nextState,
      scheduler: { ...expectedResult.nextState.scheduler,
        decisionSequence: expectedResult.nextState.scheduler.decisionSequence + 1 } } } } };
  const comparison = compareAiDecisionBundlesV1(artifact, candidate);
  const hypothetical = structuredClone(payload);
  const whatIf = branch === "what_if" ? runAiOfflineWhatIfV1(artifact, nativeReproBrain(capture), {
    ...hypothetical, observation: { ...hypothetical.observation, tick: hypothetical.observation.tick + 1 }
  }) : null;
  return { branch, sourceRevision, captureTick: payload.observation.tick,
    actualResultDigest: digestCanonicalAiValue(payload.expectedResult), replayResultDigest: replay.digest,
    artifactBeforeDigest, artifactAfterDigest: digestCanonicalAiValue(artifact),
    nativeBeforeDigest: before, nativeAfterDigest: await nativeDebugWorldDigest(page),
    classification: whatIf?.classification ?? comparison.classification,
    firstDifferencePath: whatIf?.firstDifference?.path ?? comparison.firstDifference?.path ?? null,
    firstDifferenceExpected: whatIf?.firstDifference?.expected ?? comparison.firstDifference?.expected ?? null,
    firstDifferenceActual: whatIf?.firstDifference?.actual ?? comparison.firstDifference?.actual ?? null };
}

/** Full canonical world by default. Late-delivery probes compare physical effects plus separate controller/epoch proofs. */
export async function nativeDebugWorldDigest(page: Page, physicalEffectsOnly = false) {
  const projection = await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const hash = services.find((entry): entry is StateHashService => "captureAuthoritativeProjection" in entry);
    if (!scene || !hash) throw new Error("debug_comparison_native_projection_missing");
    return hash.captureAuthoritativeProjection(scene);
  });
  const { commandAuthority: _authority, aiControllers: _controllers, ...physicalSystems } = projection.systems;
  const compared = physicalEffectsOnly ? { ...projection, systems: physicalSystems } : projection;
  return digestCanonicalAiValue(JSON.parse(JSON.stringify(compared)));
}
