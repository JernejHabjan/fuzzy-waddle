import type { Browser } from "@playwright/test";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import type { NativeRetentionProof } from "./skirmish-ai-native-retention-proof";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";
import { captureRuntimeHumanAuthority } from "./skirmish-ai-runtime-human-capture";
import { pressureNativeRetention } from "./skirmish-ai-native-retention-pressure";
import { installNativeRetentionWitness, nativeRetentionWitnessAction } from "./skirmish-ai-native-retention-witness";
import { readNativeRetentionBoundary } from "./skirmish-ai-native-retention-boundary";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { saveNativeMatch, reloadNativeMatch } from "./skirmish-ai-native-save-reload";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";
import { runNativeRetentionMultiplayer } from "./skirmish-ai-native-retention-multiplayer";

/** Original native envelopes come from actual dispatch receipts; retention is crossed by ordinary human commands. */
export async function runNativeRetentionVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string
) {
  const player = fixture.recipe.aiPlayerNumber;
  let original: GameCommand | undefined, nativeRetention: NativeRetentionProof | undefined;
  let opponentCapture: AiRuntimeProductionCaptureV1 | undefined;
  let save: Awaited<ReturnType<typeof saveNativeMatch>> | undefined;
  let saved: Awaited<ReturnType<typeof captureNativeContinuationBoundary>> | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, async (page, index, checkpoint) => {
      if (index === -1) { await captureRuntimeHumanAuthority(page, 1, 2400); return; }
      if (checkpoint?.tick === 20) {
        const capture = await captureRuntimeProductionAuthority(page, player);
        const held = capture.facts.find((fact) => fact.kind === "authority_delivery" && fact.delivery.phase === "held" &&
          fact.delivery.outcome?.kind === "applied");
        if (held?.kind !== "authority_delivery" || !held.delivery.outcome)
          throw new Error("native_retention_original_applied_receipt_missing");
        const originalId = held.delivery.outcome.commandId;
        const dispatch = capture.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished" &&
          fact.event.receipt.status === "dispatched" && fact.event.receipt.command.execution?.commandId === originalId);
        if (dispatch?.kind !== "intent_dispatch" || dispatch.event.kind !== "finished" ||
            dispatch.event.receipt.status !== "dispatched" || !dispatch.event.receipt.command.execution)
          throw new Error("native_retention_exact_original_envelope_missing");
        const originalExecution = dispatch.event.receipt.command.execution;
        original = dispatch.event.receipt.command;
        await installNativeRetentionWitness(page, 1);
        await nativeRetentionWitnessAction(page, 2049);
        const pressure = await pressureNativeRetention(page, 2049);
        const witness = await nativeRetentionWitnessAction(page);
        const compacted = await readNativeRetentionBoundary(page, original);
        const beforeEffects = await nativeDebugWorldDigest(page, true);
        const beforeContinuation = await captureNativeContinuationBoundary(page, player);
        const afterReplay = await readNativeRetentionBoundary(page, original, original);
        nativeRetention = { branch, sourceRevision: request.sourceRevision, fixtureDigest: request.fixtureDigest,
          original: originalExecution, dispatchedCount: pressure.commandIds.length,
          uniqueDispatchedCount: new Set(pressure.commandIds).size, dispatchedDigest: digestCanonicalAiValue(pressure.commandIds),
          witness, compacted, afterReplay, beforeEffects, afterEffects: await nativeDebugWorldDigest(page, true),
          beforeContinuation, afterContinuation: await captureNativeContinuationBoundary(page, player) };
      }
      if (branch === "save_restore" && checkpoint?.tick === 199) {
        saved = await captureNativeContinuationBoundary(page, player);
        save = await saveNativeMatch(page, player);
      }
      if (index === (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).length - 1)
        opponentCapture = await captureRuntimeHumanAuthority(page, 1);
    }, async (page) => {
      if (!nativeRetention || !original) throw new Error("native_retention_original_control_missing");
      if (branch === "save_restore") {
        if (!save || !saved) throw new Error("native_retention_real_save_missing");
        const loaded = await reloadNativeMatch(page, player, save);
        const restored = await captureNativeContinuationBoundary(page, player);
        const restoredAuthority = await readNativeRetentionBoundary(page, original);
        const beforeEffects = await nativeDebugWorldDigest(page, true);
        const afterReplayAuthority = await readNativeRetentionBoundary(page, original, original);
        const afterEffects = await nativeDebugWorldDigest(page, true);
        const afterReplayContinuation = await captureNativeContinuationBoundary(page, player);
        await advanceRuntimeFrames(page, player, 201);
        await page.waitForFunction((number) =>
          window.__fuzzyWaddleAiRuntimePartsV1?.(number)?.controller.isDecisionBoundarySettled(), player);
        const resumed = await captureNativeContinuationBoundary(page, player);
        const capture = await captureRuntimeProductionAuthority(page, player);
        nativeRetention = { ...nativeRetention, save: { saveId: loaded.saveId, revision: loaded.revision,
          sameRealm: loaded.sameRealm, saved, restored, restoredAuthority, afterReplayAuthority, beforeEffects, afterEffects,
          afterReplayContinuation, resumed, resumedAuthority: await readNativeRetentionBoundary(page, original),
          resumedOriginalCharges: capture.facts.filter((fact) => fact.kind === "queue_resource" &&
            fact.resource.originatingCommandContext?.execution.commandId === original?.execution?.commandId &&
            fact.resource.operation === "immediate_charge" && fact.resource.emission.phase === "finished").length,
          resumedOriginalOutputs: capture.facts.filter((fact) => fact.kind === "queue_completion" &&
            fact.completion.phase === "after" && fact.completion.item?.commandId === original?.execution?.commandId).length,
          resumedCaptureDropped: capture.droppedFactCount > 0 || capture.droppedSnapshotCount > 0 } };
      }
      if (branch === "acknowledged_compaction") nativeRetention = { ...nativeRetention,
        multiplayer: await runNativeRetentionMultiplayer(browser, { seed: request.seed ?? variant.seed, aiFaction: variant.aiFaction }) };
    });
  if (!nativeRetention) throw new Error("native_retention_proof_not_captured");
  return { ...result, opponentCapture, nativeRetention };
}
