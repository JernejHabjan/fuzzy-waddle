import type { Browser } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import { runNativeSaveVariant } from "./skirmish-ai-native-save-runner";
import { runNativeProfileTransfer } from "./skirmish-ai-native-profile-transfer";
import { readNativeSequenceScore, runNativeSequenceTail } from "./skirmish-ai-native-sequence-tail";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";

export interface NativeSequenceProof {
  readonly branch: string;
  readonly controlScore: Awaited<ReturnType<typeof readNativeSequenceScore>>;
  readonly singlePlayer: Awaited<ReturnType<typeof runNativeSequenceTail>>;
  readonly multiplayer?: Awaited<ReturnType<typeof runNativeSequenceTail>>;
}

/** Independent supported SP and MP chains share actual save/transfer owners, never a fabricated combined reload. */
export async function runNativeSequenceVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string
) {
  let singlePlayer: NativeSequenceProof["singlePlayer"] | undefined;
  let controlScore: NativeSequenceProof["controlScore"] | undefined;
  let multiplayer: NativeSequenceProof["multiplayer"];
  const result = await runNativeSaveVariant(browser, fixture, variant, request,
    branch === "host_transfer" ? "before_apply" : branch, undefined, async (page) => {
      singlePlayer = await runNativeSequenceTail(page, 2, fixture, variant, request, false);
    }, async (page) => {
      await advanceRuntimeFrames(page, 2, 18000, 1, true);
      controlScore = await readNativeSequenceScore(page, 2);
      if (!["win", "loss", "tie"].includes(controlScore.result ?? ""))
        throw new Error("native_sequence_original_control_did_not_finish");
    });
  const nativeProfileTransfer = branch === "host_transfer" ? await runNativeProfileTransfer(browser, {
    seed: request.seed ?? variant.seed, aiFaction: variant.aiFaction, aiDifficulty: variant.difficulty,
    lateDeliveryOrder: "command_then_receipt"
  }, async (page) => { multiplayer = await runNativeSequenceTail(page, 3, fixture, variant, request, true); }) : undefined;
  if (!singlePlayer || !controlScore || branch === "host_transfer" && !multiplayer)
    throw new Error("native_sequence_supported_chain_missing");
  const nativeSequence: NativeSequenceProof = { branch, controlScore, singlePlayer, ...(multiplayer ? { multiplayer } : {}) };
  return { ...result, nativeSequence, ...(nativeProfileTransfer ? { nativeProfileTransfer } : {}) };
}
