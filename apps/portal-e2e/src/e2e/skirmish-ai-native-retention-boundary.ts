import type { Page } from "@playwright/test";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { CommandBusService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/multiplayer/command-bus.service";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";

/** Reduce the actual native authority locally; no retained ID array or command body enters a model-facing report. */
export async function readNativeRetentionBoundary(
  page: Page, original: Pick<GameCommand, "playerNumber" | "execution">, replayCommand?: GameCommand
) {
  const capture = await page.evaluate(({ original, replayCommand }) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const bus = services.find((entry): entry is CommandBusService => "playReplayBatch" in entry && "getAuthorityState" in entry);
    const execution = original.execution;
    if (!scene || !bus || !execution) throw new Error("native_retention_original_or_authority_missing");
    let replayApplications = 0;
    if (replayCommand) {
      if (JSON.stringify(replayCommand.execution) !== JSON.stringify(execution))
        throw new Error("native_retention_replay_identity_differs_from_original");
      const subscription = bus.command$.subscribe((command) => {
        if (command.execution?.commandId === execution.commandId) replayApplications++;
      });
      try { bus.playReplayBatch({ tick: replayCommand.tick, playerNumber: replayCommand.playerNumber, commands: [replayCommand] }); }
      finally { subscription.unsubscribe(); }
    }
    const state = bus.getAuthorityState(), { outcomes, ...gameplayAuthority } = state;
    const rejection = [...outcomes].reverse().find((outcome) => outcome.commandId === execution.commandId &&
      outcome.kind === "rejected");
    return { gameplayAuthority, replayAttempted: !!replayCommand, replayApplications, processedCount: state.processedCommandIds.length,
      detailedOriginalPresent: state.processedCommandIds.includes(execution.commandId), authorityEpoch: state.authorityEpoch,
      processedWatermark: state.processedSequenceWatermarkByPlayer?.[original.playerNumber] ?? -1,
      activeOriginal: state.activeCommitmentsByPlayer?.[original.playerNumber]?.[execution.commitmentKey] === execution.commandId,
      activeExecution: state.activeCommandProgress?.[execution.commandId]?.execution ?? null,
      rejection: rejection ? { commandId: rejection.commandId, authorityEpoch: rejection.authorityEpoch,
        sequence: rejection.sequence, reason: rejection.reason, detail: rejection.detail ?? null } : null };
  }, { original, replayCommand });
  const { gameplayAuthority, ...bounded } = capture;
  return { ...bounded, authorityGameplayDigest: digestCanonicalAiValue(JSON.parse(JSON.stringify(gameplayAuthority))) };
}
