import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { runNativeSequenceTail } from "./skirmish-ai-native-sequence-tail";
import { nativeSaveProofFailures } from "./skirmish-ai-native-save-evaluation";
import { nativeLifecycleProofFailures } from "./skirmish-ai-native-lifecycle-evaluation";
import { nativeProfileTransferFailures } from "./skirmish-ai-native-profile-transfer-evaluation";
import { nativeLateEpochReplayFailures } from "./skirmish-ai-native-late-epoch-evaluation";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";

/** A chain must contain its own native terminal result and next scene; unrelated passing legs cannot stand in for it. */
export function nativeSequenceProofFailures(
  branch: string, result: RuntimeVariantResultV1, difficulty: "Easy" | "Normal" | "Hard"
) {
  const proof = result.nativeSequence, save = result.nativeSave;
  if (!proof || proof.branch !== branch || !save) return ["native_sequence_continuous_proof_missing"];
  const failures = nativeSaveProofFailures(branch === "host_transfer" ? "before_apply" : branch,
    save, undefined, save.control.owner.tick);
  if (save.control.owner.tick <= 401 || save.control.owner.tick > 18000 ||
      save.sourceRevision !== result.productionPreset?.sourceRevision || save.fixtureDigest !== result.productionPreset?.fixtureDigest)
    failures.push("native_sequence_full_saved_tail_or_provenance_missing");
  failures.push(...tailFailures(proof.singlePlayer, false));
  if (proof.singlePlayer.entry.worldDigest !== save.resumed.worldDigest ||
      proof.singlePlayer.terminal.worldDigest !== save.resumed.worldDigest ||
      digestCanonicalAiValue(proof.controlScore) !== digestCanonicalAiValue(proof.singlePlayer.score))
    failures.push("native_sequence_sp_terminal_detached_from_exact_codec_replay");
  if (branch === "host_transfer") {
    const transfer = result.nativeProfileTransfer, tail = proof.multiplayer;
    failures.push(...nativeProfileTransferFailures(difficulty, transfer));
    failures.push(...nativeLateEpochReplayFailures("command_then_receipt", transfer?.lateEpochReplay));
    if (!tail || !transfer) failures.push("native_sequence_real_multiplayer_tail_missing");
    else {
      failures.push(...tailFailures(tail, true));
      if (tail.entry.worldDigest !== transfer.next.worldDigest ||
          tail.entry.owner.matchId !== transfer.original.owner.matchId || tail.entry.owner.seed !== transfer.original.owner.seed)
        failures.push("native_sequence_mp_tail_not_original_promoted_match");
    }
  } else if (proof.multiplayer || result.nativeProfileTransfer) failures.push("native_sequence_unexpected_multiplayer_leg");
  if (result.aiErrors.length) failures.push("native_sequence_original_ai_errors");
  return [...new Set(failures)];
}

function tailFailures(tail: Awaited<ReturnType<typeof runNativeSequenceTail>>, multiplayer: boolean) {
  const lifecycle = tail.lifecycle;
  const failures = nativeLifecycleProofFailures("normal", { ...lifecycle, branch: "normal" }, 18000);
  if (multiplayer && lifecycle.retainedAuthorityUnchanged !== true)
    failures.push("native_sequence_disposed_original_multiplayer_authority_escaped");
  if (!["win", "loss", "tie"].includes(tail.score.result ?? "") || tail.score.deliveredResources <= 0 ||
      tail.score.damageDealt <= 0 || tail.score.produced < 1 || tail.terminal.owner.tick > 18000 ||
      tail.entry.owner.tick > tail.terminal.owner.tick || tail.entry.owner.matchId !== tail.terminal.owner.matchId ||
      tail.entry.owner.seed !== tail.terminal.owner.seed || tail.entry.profileDifficulty !== tail.terminal.profileDifficulty ||
      tail.terminal.owner.matchId !== lifecycle.original.matchId || tail.terminal.owner.tick !== lifecycle.original.tick)
    failures.push("native_sequence_original_economy_combat_finish_or_identity_missing");
  if (tail.terminal.owner.controllerCount !== 1 || tail.terminal.owner.nativePlayerCount !== 1)
    failures.push("native_sequence_terminal_duplicate_brain_or_player");
  return failures;
}
