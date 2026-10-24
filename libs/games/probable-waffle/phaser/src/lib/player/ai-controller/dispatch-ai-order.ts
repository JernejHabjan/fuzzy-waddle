import Phaser from "phaser";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { OrderData } from "../../ai/OrderData";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type { AiDecisionReasonCode } from "./ai-decision-trace";

/** The observable result of routing one AI order through the shared command authority. */
export type AiOrderDispatchResult =
  | { readonly status: "dispatched"; readonly reason: "command_dispatched" }
  | { readonly status: "dropped"; readonly reason: AiDecisionReasonCode };

/** Inputs required to decide whether an order can reach the shared command bus. */
export interface AiOrderDispatchPreconditions {
  readonly isHost: boolean;
  readonly hasCommandBus: boolean;
  readonly actorId?: string;
  readonly requiresTargetId: boolean;
  readonly targetId?: string;
}

/**
 * Validates the addressability boundary before dispatch. Keeping this pure makes
 * every missing service/ID reason testable without constructing a Phaser scene.
 */
export function getAiOrderDispatchResult({
  isHost,
  hasCommandBus,
  actorId,
  requiresTargetId,
  targetId
}: AiOrderDispatchPreconditions): AiOrderDispatchResult {
  if (!isHost) return { status: "dropped", reason: "non_host" };
  if (!hasCommandBus) return { status: "dropped", reason: "missing_command_bus" };
  if (!actorId) return { status: "dropped", reason: "missing_actor_id" };
  if (requiresTargetId && !targetId) return { status: "dropped", reason: "missing_target_id" };
  return { status: "dispatched", reason: "command_dispatched" };
}

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
 * Units or targets without an IdComponent produce a typed dropped result. They
 * cannot be addressed over the network without a stable ID, and callers must
 * not treat a dropped order as completed work.
 */
export function dispatchAiOrder(
  scene: ProbableWaffleScene,
  unit: Phaser.GameObjects.GameObject,
  order: OrderData,
  playerNumber: PlayerNumber
): AiOrderDispatchResult {
  const commandBus = getSceneService(scene, CommandBusService);
  const actorId = getActorComponent(unit, IdComponent)?.id;
  const targetObject = order.data.targetGameObject;
  const targetId = targetObject ? getActorComponent(targetObject, IdComponent)?.id : undefined;
  const result = getAiOrderDispatchResult({
    isHost: scene.isHost,
    hasCommandBus: !!commandBus,
    actorId,
    requiresTargetId: !!targetObject,
    targetId
  });
  if (result.status === "dropped") {
    console.warn(`[AI] Dropped AI order for player ${playerNumber}: ${result.reason}.`);
    return result;
  }
  if (!commandBus || !actorId) {
    return {
      status: "dropped",
      reason: commandBus ? "missing_actor_id" : "missing_command_bus"
    };
  }

  const receipt = commandBus.dispatch({
    type: "ACTOR_ACTION",
    playerNumber,
    actorIds: [actorId],
    orderType: order.orderType,
    targetObjectIds: targetId ? [targetId] : undefined,
    tileVec3: order.data.targetTileLocation,
    queue: false
  });
  if (receipt.status === "rejected") {
    return { status: "dropped", reason: "command_rejected" };
  }
  return result;
}
