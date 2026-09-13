import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { SharedQueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/shared-queue-item-type";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { OrderType } from "../../ai/order-type";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getActorComponent } from "../../data/actor-component";
import { QueueComponent } from "../../entity/components/queue/queue-component";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";

function correlationFor(intent: AiIntentV1) {
  return {
    intentId: intent.intentId.replace(/^intent:/, ""),
    effectId: intent.effectId.replace(/^effect:/, ""),
    commitmentKey: `ai:${intent.effectId}`
  };
}

function dispatchEconomicOrMovementIntent(
  intent: AiIntentV1,
  playerNumber: PlayerNumber,
  actorIndex: ActorIndexSystem,
  commandBus: CommandBusService
): boolean {
  const correlation = correlationFor(intent);
  if (intent.kind === "assign_gatherers") {
    const actors = actorIndex.getActorsByIds([...intent.actorIds]);
    if (
      actors.length === intent.actorIds.length &&
      intent.sourceActorId &&
      actorIndex.getActorById(intent.sourceActorId)
    )
      commandBus.dispatchAi(
        {
          type: "ACTOR_ACTION",
          playerNumber,
          actorIds: [...intent.actorIds],
          orderType: OrderType.Gather,
          targetObjectIds: [intent.sourceActorId],
          queue: false
        },
        correlation
      );
    return true;
  }
  if (intent.kind === "produce" || intent.kind === "research") {
    const producer = actorIndex.getActorById(intent.producerId);
    if (producer)
      commandBus.dispatchAi(
        intent.kind === "produce"
          ? { type: "PRODUCTION", playerNumber, actorIds: [intent.producerId], actorName: intent.objectName }
          : { type: "RESEARCH", playerNumber, actorIds: [intent.producerId], researchType: intent.researchType },
        correlation
      );
    return true;
  }
  if (intent.kind === "construct") {
    const builders = actorIndex.getActorsByIds([...intent.builderIds]);
    if (builders.length === intent.builderIds.length)
      commandBus.dispatchAi(
        {
          type: "CONSTRUCT",
          playerNumber,
          actorIds: [...intent.builderIds],
          actorName: intent.objectName,
          tileVec3: intent.logicalPosition,
          siteKey: intent.siteKey
        },
        correlation
      );
    return true;
  }
  if (intent.kind === "resume_construct") {
    const builders = actorIndex.getActorsByIds([...intent.actorIds]);
    if (builders.length === intent.actorIds.length && actorIndex.getActorById(intent.targetActorId))
      commandBus.dispatchAi(
        {
          type: "ACTOR_ACTION",
          playerNumber,
          actorIds: [...intent.actorIds],
          orderType: OrderType.Build,
          targetObjectIds: [intent.targetActorId],
          queue: false
        },
        correlation
      );
    return true;
  }
  if (intent.kind === "move" || intent.kind === "scout") {
    const actors = actorIndex.getActorsByIds([...intent.actorIds]);
    if (actors.length === intent.actorIds.length)
      commandBus.dispatchAi(
        {
          type: "ACTOR_ACTION",
          playerNumber,
          actorIds: [...intent.actorIds],
          orderType: OrderType.Move,
          tileVec3: intent.logicalPosition,
          queue: false
        },
        correlation
      );
    return true;
  }
  if (intent.kind === "board") {
    const passengers = actorIndex.getActorsByIds([...intent.actorIds]);
    if (passengers.length === intent.actorIds.length && actorIndex.getActorById(intent.transportId))
      commandBus.dispatchAi(
        {
          type: "ACTOR_ACTION",
          playerNumber,
          actorIds: [...intent.actorIds],
          orderType: OrderType.EnterContainer,
          targetObjectIds: [intent.transportId],
          queue: false
        },
        correlation
      );
    return true;
  }
  if (intent.kind === "unload") {
    if (actorIndex.getActorById(intent.transportId))
      commandBus.dispatchAi(
        {
          type: "UNLOAD",
          playerNumber,
          actorIds: [intent.transportId],
          passengerIds: [...intent.passengerIds],
          tileVec3: intent.logicalPosition
        },
        correlation
      );
    return true;
  }
  return false;
}

function dispatchCombatOrControlIntent(
  intent: AiIntentV1,
  playerNumber: PlayerNumber,
  actorIndex: ActorIndexSystem,
  commandBus: CommandBusService
): void {
  const correlation = correlationFor(intent);
  if (intent.kind === "attack") {
    const actors = actorIndex.getActorsByIds([...intent.actorIds]);
    if (actors.length === intent.actorIds.length)
      commandBus.dispatchAi(
        {
          type: "ACTOR_ACTION",
          playerNumber,
          actorIds: [...intent.actorIds],
          orderType: OrderType.Attack,
          ...(intent.targetActorId ? { targetObjectIds: [intent.targetActorId] } : {}),
          ...(intent.targetPosition ? { tileVec3: intent.targetPosition } : {}),
          queue: false
        },
        correlation
      );
    return;
  }
  if (intent.kind === "heal" || intent.kind === "repair" || intent.kind === "tend") {
    const actors = actorIndex.getActorsByIds([...intent.actorIds]);
    if (actors.length === intent.actorIds.length && actorIndex.getActorById(intent.targetActorId))
      commandBus.dispatchAi(
        {
          type: "ACTOR_ACTION",
          playerNumber,
          actorIds: [...intent.actorIds],
          orderType:
            intent.kind === "heal" ? OrderType.Heal : intent.kind === "repair" ? OrderType.Repair : OrderType.Gather,
          targetObjectIds: [intent.targetActorId],
          queue: false
        },
        correlation
      );
    return;
  }
  if (intent.kind === "stop") {
    const actors = actorIndex.getActorsByIds([...intent.actorIds]);
    if (actors.length === intent.actorIds.length)
      commandBus.dispatchAi({ type: "STOP", playerNumber, actorIds: [...intent.actorIds] }, correlation);
    return;
  }
  if (intent.kind === "cancel") {
    const actor = actorIndex.getActorById(intent.actorId);
    const item = actor ? getActorComponent(actor, QueueComponent)?.items[intent.queueIndex] : undefined;
    if (item?.type === SharedQueueItemType.Production)
      commandBus.dispatchAi(
        { type: "CANCEL_PRODUCTION", playerNumber, actorIds: [intent.actorId], queueIndex: intent.queueIndex },
        correlation
      );
    else if (item?.type === SharedQueueItemType.Research)
      commandBus.dispatchAi({ type: "CANCEL_RESEARCH", playerNumber, actorIds: [intent.actorId] }, correlation);
    return;
  }
  if (intent.kind === "cast") {
    if (actorIndex.getActorById(intent.actorId) && intent.targetPosition)
      commandBus.dispatchAi(
        {
          type: "CAST_SPELL",
          playerNumber,
          actorIds: [intent.actorId],
          spellType: intent.spellType,
          ...(intent.targetActorId ? { targetObjectId: intent.targetActorId } : {}),
          tileVec3: intent.targetPosition
        },
        correlation
      );
    return;
  }
  if (intent.kind === "concede")
    commandBus.dispatchAi({ type: "CONCEDE", playerNumber, actorIds: [], reason: intent.reason }, correlation);
}

/** Translates accepted macro and transport intents through the shared player command authority. */
/** Stage 13 also routes accepted tactical attack, recovery, healing and manual spell intents here. */
export function dispatchAiIntents(
  scene: ProbableWaffleScene,
  playerNumber: PlayerNumber,
  intents: readonly AiIntentV1[]
): void {
  const actorIndex = getSceneService(scene, ActorIndexSystem);
  const commandBus = getSceneService(scene, CommandBusService);
  if (!actorIndex || !commandBus) return;
  for (const intent of intents) {
    if (dispatchEconomicOrMovementIntent(intent, playerNumber, actorIndex, commandBus)) continue;
    dispatchCombatOrControlIntent(intent, playerNumber, actorIndex, commandBus);
  }
}
