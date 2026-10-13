import type Phaser from "phaser";
import { Subscription } from "rxjs";
import {
  ProbableWaffleGameCommandTypes,
  type GameCommandInput,
  type GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { RepresentableComponent } from "../../../entity/components/representable-component";
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
    return { control, producer, actorId, owner, setupItem, requested: false, applied: false };
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
      if (entry.applied || clock.currentTick < control.applicationTick) continue;
      if (clock.currentTick !== control.applicationTick || !producer.active || producer.scene !== scene) {
        throw new Error(`runtime_preset_control_application_skipped:${control.id}`);
      }
      const action = control.action;
      let command: GameCommandInput;
      if (action.kind === "rally") {
        const target = actors.get(action.targetFixtureActorId);
        const targetId = target && getActorComponent(target, IdComponent)?.id;
        const position = target && getActorComponent(target, RepresentableComponent)?.logicalWorldTransform;
        const tile = target && getGameObjectCurrentTile(target);
        if (
          !target?.active ||
          !targetId ||
          !position ||
          !tile ||
          getActorComponent(target, OwnerComponent)?.getOwner() !== owner
        ) {
          throw new Error(`runtime_preset_control_rally_target_missing:${control.id}`);
        }
        command = {
          type: ProbableWaffleGameCommandTypes.SetRallyPoint,
          playerNumber: owner,
          actorIds: [actorId],
          targetObjectId: targetId,
          tileVec3: { ...tile, z: position.z },
          worldVec3: position
        };
      } else if (action.kind === "produce") {
        command = {
          type: ProbableWaffleGameCommandTypes.Production,
          playerNumber: owner,
          actorIds: [actorId],
          actorName: action.actorName
        };
      } else {
        if (!setupItem) throw new Error(`runtime_preset_control_paid_item_missing:${control.id}`);
        const index = getActorComponent(producer, QueueComponent)?.allItems.indexOf(setupItem);
        if (index === undefined || index < 0) throw new Error(`runtime_preset_control_paid_item_lost:${control.id}`);
        command = {
          type: ProbableWaffleGameCommandTypes.CancelProduction,
          playerNumber: owner,
          actorIds: [actorId],
          queueIndex: index
        };
      }
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
        entry.applied = true;
      } finally {
        listener.unsubscribe();
      }
    }
    if (pending.every((entry) => entry.applied)) cleanup.unsubscribe();
  };
  advance();
  if (pending.every((entry) => entry.applied)) return;
  cleanup.add(clock.tick$.subscribe(advance));
  cleanup.add(scene.onShutdown.subscribe(() => cleanup.unsubscribe()));
}
