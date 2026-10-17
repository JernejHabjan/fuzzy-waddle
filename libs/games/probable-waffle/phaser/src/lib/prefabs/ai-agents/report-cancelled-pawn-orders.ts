import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type Phaser from "phaser";
import type { OrderData } from "../../ai/OrderData";
import { getActorComponent } from "../../data/actor-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { classifyPlayerPawnOrderTerminalOutcome } from "./player-pawn-order-terminal-outcome";

/** Settles queued commands that are replaced before the pawn promotes them to its active order. */
export function reportCancelledPawnOrders(
  gameObject: Phaser.GameObjects.GameObject,
  orders: readonly OrderData[],
  reason: string
): void {
  const actorId = getActorComponent(gameObject, IdComponent)?.id;
  if (!actorId) return;
  const commandBus = getSceneService(gameObject.scene, CommandBusService);
  const tick = getSceneService(gameObject.scene, SimulationTickService)?.currentTick ?? 0;
  const terminal = classifyPlayerPawnOrderTerminalOutcome(reason);
  const commandIds = new Set<string>();
  for (const order of orders) {
    const context = order.data.commandContext;
    if (!context || commandIds.has(context.execution.commandId)) continue;
    commandIds.add(context.execution.commandId);
    commandBus?.reportPersistedOutcome({
      schemaVersion: 1,
      kind: terminal.kind,
      reason: terminal.reason,
      tick,
      playerNumber: context.playerNumber,
      commandId: context.execution.commandId,
      commitmentKey: context.execution.commitmentKey,
      authorityEpoch: context.execution.authorityEpoch,
      sequence: context.execution.sequence,
      ...(context.execution.intentId ? { intentId: context.execution.intentId } : {}),
      ...(context.execution.effectId ? { effectId: context.execution.effectId } : {}),
      actorIds: [actorId],
      worldLinkIds: [],
      detail: reason
    });
  }
}
