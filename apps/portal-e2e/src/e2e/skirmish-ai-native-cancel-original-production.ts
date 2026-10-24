import type { Page } from "@playwright/test";
import { ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { CommandBusService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/multiplayer/command-bus.service";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { QueueComponent } from "@fuzzy-waddle/probable-waffle-phaser/entity/components/queue/queue-component";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";

/** Request cancellation of the exact original AI-backed native queue item; never infer application from the request. */
export async function cancelNativeOriginalProduction(page: Page, playerNumber: number) {
  const capture = await captureRuntimeProductionAuthority(page, playerNumber);
  const held = capture.facts.find((fact) => fact.kind === "authority_delivery" && fact.delivery.phase === "held" &&
    fact.delivery.outcome?.kind === "applied");
  if (held?.kind !== "authority_delivery" || !held.delivery.outcome)
    throw new Error("native_cancel_original_applied_receipt_missing");
  const original = held.delivery.outcome;
  const producerId = capture.snapshots.at(-1)?.queues.find((queue) => queue.lanes.some((lane) =>
    lane.items.some((item) => item.commandId === original.commandId)))?.actorId;
  if (!producerId) throw new Error("native_cancel_original_physical_queue_missing");
  return page.evaluate(({ original, producerId, commandType }) => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 })
      .__fuzzyWaddleAiRuntimeBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const bus = services.find((entry): entry is CommandBusService => "dispatchDeterministic" in entry && "getAuthorityState" in entry);
    const index = services.find((entry): entry is ActorIndexSystem => "getOwnedActors" in entry && "getActorById" in entry);
    if (!scene || !bus || !index || !scene.isHost) throw new Error("native_cancel_original_services_missing");
    const producer = index.getActorById(producerId);
    const components = producer?.getData("actorData")?.components as Map<{ name: string }, unknown> | undefined;
    const queue = [...(components ?? [])].find(([key]) => key.name === "QueueComponent")?.[1] as QueueComponent | undefined;
    const queueIndex = queue?.allItems.findIndex((item) => item.commandContext?.execution?.commandId === original.commandId) ?? -1;
    if (!queue || queueIndex < 0) throw new Error("native_original_cancel_item_no_longer_pending");
    const tick = window.__fuzzyWaddleAiRuntimePartsV1?.(original.playerNumber)?.tickService.currentTick;
    const receipt = bus.dispatchDeterministic({ type: commandType, playerNumber: original.playerNumber,
      actorIds: [producerId], queueIndex }, "human");
    if (tick === undefined || receipt.status !== "dispatched") throw new Error("native_original_cancel_request_not_dispatched");
    return { tick, originalCommandId: original.commandId, cancellationCommandId: receipt.command.execution?.commandId ?? null,
      producerId, queueIndex };
  }, { original, producerId, commandType: ProbableWaffleGameCommandTypes.CancelProduction });
}
