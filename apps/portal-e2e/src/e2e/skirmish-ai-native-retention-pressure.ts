import type { Page } from "@playwright/test";
import { ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { CommandBusService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/multiplayer/command-bus.service";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";

/** Ordinary human rally commands cross real retention without spending resources, moving armies or editing dedup maps. */
export async function pressureNativeRetention(page: Page, count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 4096) throw new Error("native_retention_pressure_count_invalid");
  return page.evaluate(({ count, commandType }) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const bus = services.find((entry): entry is CommandBusService => "dispatch" in entry && "getAuthorityState" in entry);
    const index = services.find((entry): entry is ActorIndexSystem => "getOwnedActors" in entry && "getActorById" in entry);
    const playerNumber = scene?.playerOrNull?.playerNumber;
    if (!scene || !bus || !index || playerNumber === undefined) throw new Error("native_retention_real_human_missing");
    const producer = index.getOwnedActors(playerNumber).find((actor) => {
      const components = actor.getData("actorData")?.components as Map<{ name: string }, unknown> | undefined;
      return [...(components?.keys() ?? [])].some((key) => key.name === "ProductionComponent");
    });
    const components = producer?.getData("actorData")?.components as Map<{ name: string }, unknown> | undefined;
    const actorId = ([...(components ?? [])].find(([key]) => key.name === "IdComponent")?.[1] as { id?: string } | undefined)?.id;
    if (!producer?.active || !actorId || index.getActorById(actorId) !== producer)
      throw new Error("native_retention_actual_human_producer_missing");
    const commandIds: string[] = [];
    for (let position = 0; position < count; position++) {
      const receipt = bus.dispatch({ type: commandType, playerNumber, actorIds: [actorId],
        tileVec3: { x: 30, y: 30, z: 0 }, worldVec3: { x: 32, y: 976, z: 0 } });
      if (receipt.status !== "dispatched" || !receipt.command.execution || receipt.command.execution.source !== "human")
        throw new Error("native_retention_human_rally_not_dispatched");
      commandIds.push(receipt.command.execution.commandId);
    }
    return { playerNumber, actorId, commandIds };
  }, { count, commandType: ProbableWaffleGameCommandTypes.SetRallyPoint });
}
