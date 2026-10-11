import type Phaser from "phaser";
import {
  ProbableWaffleGameCommandTypes, type GameCommandInput, type GameCommandOutcome, type ProductionCommand, type ResearchCommand
} from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer } from "../../../data/scene-data";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { CommandBusService, type GameCommandDispatchReceipt } from "../../../world/services/multiplayer/command-bus.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import type { AiRuntimePresetApplicationV1 } from "./ai-runtime-preset-application-v1";
import { assertAiRuntimePresetQueuePayment } from "./assert-ai-runtime-preset-queue-payment";
import type { AiRuntimePresetQueueApplicationV1 } from "./ai-runtime-preset-queue-application-v1";

/** Seeds real paid production/research through shared commands. Rejection or missing physical application aborts setup. */
export function applyAiRuntimePresetQueues(
  scene: ProbableWaffleScene,
  preset: AiRuntimePresetWorldV1,
  actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): Pick<AiRuntimePresetApplicationV1, "queuedItemCount" | "initialQueueItems" | "queueApplications"> {
  const bus = getSceneService(scene, CommandBusService);
  const requests = [
    ...(preset.queues ?? []).flatMap((queue) => Array.from({ length: queue.count }, () => ({
      fixtureId: queue.producerFixtureActorId,
      payload: {
        type: ProbableWaffleGameCommandTypes.Production, actorName: queue.actorName
      } satisfies Pick<ProductionCommand, "type" | "actorName">
    }))),
    ...(preset.researchQueues ?? []).map((queue) => ({
      fixtureId: queue.producerFixtureActorId,
      payload: {
        type: ProbableWaffleGameCommandTypes.Research, researchType: queue.researchType
      } satisfies Pick<ResearchCommand, "type" | "researchType">
    }))
  ];
  const initialQueueItems: AiRuntimePresetApplicationV1["initialQueueItems"][number][] = [];
  const queueApplications: AiRuntimePresetQueueApplicationV1[] = [];
  if (requests.length && !bus) throw new Error("runtime_preset_queue_bus_missing");
  for (const request of requests) {
    if (!bus) throw new Error("runtime_preset_queue_bus_missing");
    const producer = actors.get(request.fixtureId);
    const actorId = producer && getActorComponent(producer, IdComponent)?.id;
    const owner = producer && getActorComponent(producer, OwnerComponent)?.getOwner();
    const queue = producer && getActorComponent(producer, QueueComponent);
    const player = owner === undefined ? undefined : getPlayer(scene, owner);
    if (!producer || producer.scene !== scene || !producer.active || !actorId || owner === undefined || !queue || !player) {
      throw new Error(`runtime_preset_queue_authority_missing:${request.fixtureId}`);
    }
    const beforeItems = new Set(queue.allItems);
    const resourcesBefore = { ...player.getResources() };
    const outcomes: GameCommandOutcome[] = [];
    const subscription = bus.commandOutcome$.subscribe((outcome) => outcomes.push(structuredClone(outcome)));
    let receipt: GameCommandDispatchReceipt;
    try {
      receipt = bus.dispatchDeterministic({
        ...request.payload, playerNumber: owner, actorIds: [actorId]
      } satisfies GameCommandInput);
    } finally {
      subscription.unsubscribe();
    }
    if (receipt.status !== "dispatched" || !receipt.command.execution) {
      throw new Error(`runtime_preset_queue_dispatch_rejected:${request.fixtureId}`);
    }
    const command = receipt.command;
    const commandId = receipt.command.execution.commandId;
    const applied = outcomes.filter((outcome) => outcome.commandId === commandId && outcome.playerNumber === owner);
    const added = queue.allItems.filter((item) => !beforeItems.has(item));
    const item = added[0];
    const productMatches = request.payload.type === ProbableWaffleGameCommandTypes.Production
      ? item?.productionData?.actorName === request.payload.actorName
      : item?.researchData === request.payload.researchType;
    if (command.type !== request.payload.type || command.playerNumber !== owner || command.actorIds.length !== 1 ||
      command.actorIds[0] !== actorId || ![...beforeItems].every((previous) => queue.allItems.includes(previous)) ||
      !applied.some((outcome) => outcome.kind === "applied" && outcome.actorIds.includes(actorId)) ||
      applied.some((outcome) => ["rejected", "failed"].includes(outcome.kind)) || added.length !== 1 || !item ||
      item.commandContext?.execution.commandId !== commandId || item.commandContext.playerNumber !== owner ||
      item.commandContext.actorIds.length !== 1 || item.commandContext.actorIds[0] !== actorId || !productMatches) {
      throw new Error(`runtime_preset_queue_not_applied:${request.fixtureId}`);
    }
    const resourcesAfter = { ...player.getResources() };
    // The shared command owns eligibility/payment; compare its actual setup balance against the shared definition.
    assertAiRuntimePresetQueuePayment(item, resourcesBefore, resourcesAfter);
    const itemId = `queue:${actorId}:${commandId}`;
    initialQueueItems.push({ producerFixtureActorId: request.fixtureId, producerActorId: actorId, itemId,
      kind: item.productionData ? "production" : "research", objectName: item.productionData?.actorName ?? null,
      researchType: item.researchData ?? null });
    queueApplications.push(structuredClone({ producerFixtureActorId: request.fixtureId, itemId, command,
      outcomes: applied, resourcesBefore, resourcesAfter }));
  }
  return { queuedItemCount: initialQueueItems.length, initialQueueItems, queueApplications };
}
