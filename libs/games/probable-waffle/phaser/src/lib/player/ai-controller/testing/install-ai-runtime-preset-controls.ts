import { createAiRuntimePresetCommand } from "./create-ai-runtime-preset-command";
import type Phaser from "phaser";
import { Subscription } from "rxjs";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";

/** Explicit test controller. Delays dispatch, not refunds or gameplay; exact paid setup handles survive index changes. */
export function installAiRuntimePresetControls(
  scene: ProbableWaffleScene,
  preset: AiRuntimePresetWorldV1,
  actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): void {
  if (!preset.controls?.length) return;
  const clock = getSceneService(scene, SimulationTickService);
  const bus = getSceneService(scene, CommandBusService);
  if (!clock || !bus) throw new Error("runtime_preset_control_services_missing");
  const pending = preset.controls.map((control) => {
    const producer = actors.get(control.producerFixtureActorId);
    const actorId = producer && getActorComponent(producer, IdComponent)?.id;
    const owner = producer && getActorComponent(producer, OwnerComponent)?.getOwner();
    const setupItem =
      control.action.kind === "cancel_production" && producer
        ? getActorComponent(producer, QueueComponent)?.allItems[control.action.setupQueueIndex]
        : undefined;
    if (
      !producer ||
      !actorId ||
      owner === undefined ||
      (control.action.kind === "cancel_production" && !setupItem?.productionData)
    ) {
      throw new Error(`runtime_preset_control_actor_missing:${control.id}`);
    }
    return { control, producer, actorId, owner, setupItem, requested: false, settled: false };
  });
  const cleanup = new Subscription();
  const advance = () => {
    for (const entry of pending) {
      const { control, producer, actorId, owner, setupItem } = entry;
      const record = (
        phase: AiRuntimePresetControlEvent["phase"],
        command: AiRuntimePresetControlEvent["command"],
        outcomes: readonly GameCommandOutcome[]
      ) =>
        scene.events.emit(AI_RUNTIME_PRESET_CONTROL_EVENT, {
          id: control.id,
          playerNumber: owner,
          actorId,
          phase,
          requestedTick: control.requestTick,
          scheduledTick: control.applicationTick,
          setupItemId: setupItem?.commandContext
            ? `queue:${actorId}:${setupItem.commandContext.execution.commandId}`
            : null,
          command,
          outcomes
        } satisfies AiRuntimePresetControlEvent);
      if (!entry.requested && clock.currentTick >= control.requestTick) {
        if (clock.currentTick !== control.requestTick)
          throw new Error(`runtime_preset_control_request_skipped:${control.id}`);
        record("requested", null, []);
        entry.requested = true;
      }
      if (entry.settled || clock.currentTick < control.applicationTick) continue;
      if (clock.currentTick !== control.applicationTick) {
        throw new Error(`runtime_preset_control_application_skipped:${control.id}`);
      }
      if (!producer.active || producer.scene !== scene || getActorComponent(producer, HealthComponent)?.killed) {
        record("unavailable", null, []);
        entry.settled = true;
        continue;
      }
      const command = createAiRuntimePresetCommand(scene, preset.fixtureId, control, actors, producer, actorId, owner, setupItem);
      const outcomes: GameCommandOutcome[] = [];
      const listener = bus.commandOutcome$.subscribe((outcome) => outcomes.push(structuredClone(outcome)));
      try {
        const receipt = bus.dispatchDeterministic(command, "human");
        if (receipt.status !== "dispatched") throw new Error(`runtime_preset_control_admission_failed:${control.id}`);
        record(
          "applied",
          receipt.command,
          outcomes.filter((outcome) => outcome.commandId === receipt.command.execution?.commandId)
        );
        entry.settled = true;
      } finally {
        listener.unsubscribe();
      }
    }
    if (pending.every((entry) => entry.settled)) cleanup.unsubscribe();
  };
  advance();
  if (pending.every((entry) => entry.settled)) return;
  cleanup.add(clock.tick$.subscribe(advance));
  cleanup.add(scene.onShutdown.subscribe(() => cleanup.unsubscribe()));
}
