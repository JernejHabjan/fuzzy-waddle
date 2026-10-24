import type { Page } from "@playwright/test";
import type Phaser from "phaser";
import { ProbableWaffleGameInstanceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type GameProbableWaffleScene from
  "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";

export type NativeReplayStep = "tick" | "decision" | "queue_progress";

/** Named bounded predicates step only a marked isolated SP codec replay, never an attached multiplayer scene. */
export async function stepNativeReplay(page: Page, kind: NativeReplayStep, maximumTick: number) {
  if (!["tick", "decision", "queue_progress"].includes(kind) || !Number.isSafeInteger(maximumTick) || maximumTick > 4000)
    throw new Error("native_replay_step_predicate_or_ceiling_invalid");
  await page.evaluate((supportedType) => {
    const realm = window as unknown as { __nativeIsolatedReplay?: boolean;
      __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 };
    const scene = realm.__fuzzyWaddleAiRuntimeBrowserTestV1?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key.startsWith("Map")) as GameProbableWaffleScene | undefined;
    if (realm.__nativeIsolatedReplay !== true ||
        scene?.baseGameData.gameInstance.gameInstanceMetadata.data.type !== supportedType)
      throw new Error("native_replay_step_requires_isolated_single_player");
  }, ProbableWaffleGameInstanceType.Skirmish);
  const before = await readNativeStepBoundary(page);
  const queue = kind === "queue_progress" ? await readNativeQueueProgress(page) : null;
  if (kind === "queue_progress" && !queue) throw new Error("native_replay_named_progress_premise_missing");
  const ceiling = Math.min(before.tick + 200, maximumTick);
  for (let tick = before.tick + 1; tick <= ceiling; tick++) {
    await advanceRuntimeFrames(page, 2, tick);
    await page.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(2)?.controller.isDecisionBoundarySettled());
    const after = await readNativeStepBoundary(page);
    const progress = queue ? await readNativeQueueProgress(page, queue.id) : null;
    if (kind === "tick" || kind === "decision" && after.sequence === before.sequence + 1 ||
        kind === "queue_progress" && queue && progress && progress.remainingTime < queue.remainingTime) {
      if (after.tick !== tick || after.sequence < before.sequence || kind === "decision" && after.sequence !== before.sequence + 1)
        throw new Error("native_replay_step_overshot_safe_boundary");
      return { kind, before, after, originalQueueId: queue?.id ?? null,
        beforeRemainingTime: queue?.remainingTime ?? null, afterRemainingTime: progress?.remainingTime ?? null };
    }
    if (kind === "decision" && after.sequence > before.sequence + 1) throw new Error("native_replay_decision_step_overshot");
  }
  throw new Error(`native_replay_named_boundary_not_reached:${kind}`);
}

async function readNativeStepBoundary(page: Page) {
  return page.evaluate(() => {
    const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(2), brain = parts?.controller.getBrainState();
    if (!parts || !brain || !parts.controller.isDecisionBoundarySettled()) throw new Error("native_replay_unsafe_step_boundary");
    return { tick: parts.tickService.currentTick, sequence: brain.scheduler.decisionSequence, settled: true as const };
  });
}

async function readNativeQueueProgress(page: Page, originalId?: string) {
  return page.evaluate((originalId) => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 })
      .__fuzzyWaddleAiRuntimeBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      GameProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const index = services.find((entry): entry is { getOwnedActors(playerNumber: number): Phaser.GameObjects.GameObject[] } =>
      "getOwnedActors" in entry && "getActorById" in entry);
    for (const actor of index?.getOwnedActors(2) ?? []) {
      const components = actor.getData("actorData")?.components as Map<unknown, object> | undefined;
      const queue = [...(components?.values() ?? [])].find((entry): entry is { allItems: {
        remainingTime: number; commandContext?: { execution: { commandId: string } }; productionData?: unknown }[] } =>
        "allItems" in entry);
      const item = queue?.allItems.find((item) => item.remainingTime > 0 && item.commandContext && item.productionData &&
        (originalId === undefined || item.commandContext.execution.commandId === originalId));
      if (item?.commandContext) return { id: item.commandContext.execution.commandId, remainingTime: item.remainingTime };
    }
    return null;
  }, originalId);
}
