import Phaser from "phaser";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/command-bus.service";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/components/id-component";
import type { OrderData } from "../../ai/OrderData";
import type { PlayerNumber } from "@fuzzy-waddle/api-interfaces";

/**
 * Converts an AI-generated OrderData into an ActorActionCommand and dispatches
 * it through the CommandBus.
 *
 * In multiplayer the command is buffered, sent to the server, relayed to all
 * clients, and executed after INPUT_DELAY_TICKS — same path as human commands.
 * In single-player the command executes immediately (no buffering).
 *
 * Only the host calls this (AiPlayerHandler guards strategic AI creation with
 * scene.isHost).  Non-host clients receive the command via the relay and apply
 * it through ActionSystem, just like any other command.
 *
 * Units or targets without an IdComponent are skipped silently — they cannot
 * be addressed over the network without a stable ID.
 */
export function dispatchAiOrder(
  scene: Phaser.Scene,
  unit: Phaser.GameObjects.GameObject,
  order: OrderData,
  playerNumber: PlayerNumber
): void {
  if ("isHost" in scene && scene.isHost === false) {
    console.warn(`[AI] Skipping AI dispatch for player ${playerNumber} on non-host client.`);
    return;
  }

  const commandBus = getSceneService(scene, CommandBusService);
  if (!commandBus) return;

  const actorId = getActorComponent(unit, IdComponent)?.id;
  if (!actorId) {
    console.warn(`[AI] Missing actor ID for AI unit "${unit.name}" (player ${playerNumber}); command dropped.`);
    return;
  }

  const targetObject = order.data.targetGameObject;
  let targetObjectIds: string[] | undefined;
  if (targetObject) {
    const targetId = getActorComponent(targetObject, IdComponent)?.id;
    if (targetId) targetObjectIds = [targetId];
  }

  commandBus.dispatch({
    type: "ACTOR_ACTION",
    playerNumber,
    actorIds: [actorId],
    orderType: order.orderType,
    targetObjectIds,
    tileVec3: order.data.targetTileLocation,
    queue: false
  });
}
