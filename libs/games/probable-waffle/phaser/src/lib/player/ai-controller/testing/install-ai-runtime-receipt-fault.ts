import type Phaser from "phaser";
import { Subscription } from "rxjs";
import { DamageType, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { QUEUE_COMPLETION_AUTHORITY_EVENT, type QueueCompletionAuthorityEvent } from
  "../../../entity/components/queue/queue-completion-authority-event";
import { AI_INTENT_COMMAND_DISPATCH_EVENT, type AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import { installAiCommandOutcomeDelivery } from "../ai-command-outcome-delivery";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { AI_RUNTIME_AUTHORITY_DELIVERY_EVENT, type AiRuntimeAuthorityDeliveryV1 } from "./ai-runtime-authority-delivery-v1";

/** Withhold only the addressed AI consumer; normal callbacks retain exact native identity and FIFO delivery order. */
export function installAiRuntimeReceiptFault(scene: ProbableWaffleScene, preset: AiRuntimePresetWorldV1): void {
  const fault = preset.receiptFault;
  if (!fault) return;
  const clock = getSceneService(scene, SimulationTickService), bus = getSceneService(scene, CommandBusService);
  const index = getSceneService(scene, ActorIndexSystem);
  if (!clock || !bus || !index) throw new Error("runtime_receipt_fault_services_missing");
  const cleanup = new Subscription(), effects = new Set<string>(), selected = new Set<string>();
  const held: { outcome: GameCommandOutcome; accept: (outcome: GameCommandOutcome) => void }[] = [];
  const losses: { actor: Phaser.GameObjects.GameObject; commandId: string; atTick: number }[] = [];
  let destroyed = false, historyObserved = false, contended = false, emitted = 0;
  const within = () => !cleanup.closed && clock.currentTick >= fault.fromTick && clock.currentTick <= fault.throughTick;
  const record = (phase: AiRuntimeAuthorityDeliveryV1["phase"], outcome: GameCommandOutcome | null, actorId: string | null) => {
    if (++emitted > 1024) throw new Error("runtime_receipt_fault_evidence_overflow");
    scene.events.emit(AI_RUNTIME_AUTHORITY_DELIVERY_EVENT, { faultId: fault.id, playerNumber: fault.playerNumber,
      tick: clock.currentTick, phase, outcome: outcome ? structuredClone(outcome) : null, actorId,
      pendingCount: selected.size } satisfies AiRuntimeAuthorityDeliveryV1);
  };
  const request = (event: AiIntentCommandDispatchEvent) => {
    if (!within() || event.kind !== "requested" || event.playerNumber !== fault.playerNumber ||
        fault.commandKind === "production" && event.command.type !== "PRODUCTION" ||
        fault.commandKind === "research" && event.command.type !== "RESEARCH" ||
        effects.size >= fault.maximumCommands) return;
    effects.add(event.correlation.effectId);
    if (!fault.contendQueue || contended || event.command.type !== "PRODUCTION") return;
    const producerId = event.command.actorIds[0], producer = producerId && index.getActorById(producerId);
    const queue = producer && getActorComponent(producer, QueueComponent);
    const capacity = queue ? queue.queueDefinition.queueCount * queue.queueDefinition.capacityPerQueue : 0;
    if (!queue || capacity < 1 || capacity > 32) throw new Error("runtime_receipt_contention_capacity_unsupported");
    contended = true;
    while (queue.allItems.length < capacity) {
      const before = queue.allItems.length;
      const receipt = bus.dispatchDeterministic(event.command, "human");
      if (receipt.status !== "dispatched" || queue.allItems.length !== before + 1)
        throw new Error("runtime_receipt_contention_native_queue_not_filled");
    }
    record("queue_contended", null, producerId ?? null);
  };
  scene.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, request);
  cleanup.add(() => scene.events.off(AI_INTENT_COMMAND_DISPATCH_EVENT, request));
  cleanup.add(installAiCommandOutcomeDelivery(bus, fault.playerNumber, {
    deliver: (outcome, accept) => {
      if (!within() || outcome.kind === "dispatched" || !outcome.effectId || !effects.has(outcome.effectId)) {
        if (!destroyed) accept(outcome);
        return;
      }
      if (held.length >= 512) throw new Error("runtime_receipt_fault_pending_overflow");
      selected.add(outcome.commandId);
      held.push({ outcome: structuredClone(outcome), accept });
      record("held", outcome, outcome.actorIds[0] ?? null);
    },
    history: (outcomes) => {
      if (within() && fault.destroyOutput && losses.length) return null;
      if (!within() || !fault.holdHistory) return outcomes;
      if (!historyObserved) { historyObserved = true; record("history_unavailable", null, null); }
      return null;
    }
  }));
  const completion = (event: QueueCompletionAuthorityEvent) => {
    const command = event.item.commandContext?.execution;
    if (!fault.destroyOutput || !within() || event.phase !== "after" || !event.createdActor || !command ||
        !selected.has(command.commandId)) return;
    if (losses.length >= fault.maximumCommands) throw new Error("runtime_receipt_fault_loss_overflow");
    losses.push({ actor: event.createdActor, commandId: command.commandId, atTick: clock.currentTick + 1 });
  };
  scene.events.on(QUEUE_COMPLETION_AUTHORITY_EVENT, completion);
  cleanup.add(() => scene.events.off(QUEUE_COMPLETION_AUTHORITY_EVENT, completion));
  const release = () => {
    for (const entry of held.splice(0)) {
      if (destroyed) break;
      entry.accept(entry.outcome);
      record("released", entry.outcome, entry.outcome.actorIds[0] ?? null);
    }
  };
  cleanup.add(clock.tick$.subscribe(() => {
    for (const loss of losses.filter((entry) => entry.atTick <= clock.currentTick)) {
      losses.splice(losses.indexOf(loss), 1);
      const health = getActorComponent(loss.actor, HealthComponent), id = getActorComponent(loss.actor, IdComponent)?.id;
      if (loss.actor.scene !== scene || !loss.actor.active || !health || !id)
        throw new Error("runtime_receipt_original_output_missing_before_loss");
      if (health.healthComponentData.armour > 0) health.takeDamage(health.healthComponentData.armour, DamageType.Physical);
      health.takeDamage(Number.MAX_SAFE_INTEGER, DamageType.Physical);
      const terminal = [...held].reverse().find((entry) => entry.outcome.commandId === loss.commandId)?.outcome ?? null;
      record("output_destroyed", terminal, id);
    }
    if (clock.currentTick > fault.throughTick) { release(); cleanup.unsubscribe(); }
  }));
  cleanup.add(scene.onShutdown.subscribe(() => { destroyed = true; cleanup.unsubscribe(); }));
  cleanup.add(() => { held.length = 0; losses.length = 0; effects.clear(); selected.clear(); });
}
