import type Phaser from "phaser";
import { Subscription } from "rxjs";
import { ProbableWaffleGameCommandTypes, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { getCanonicalActorNameCached } from "../../../data/tech-tree/canonical-actor-name";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { RepresentableComponent } from "../../../entity/components/representable-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";

/** Test-owned rally destination applies once through shared commands to each ready producer, including actual AI-built replacements. */
export function installAiRuntimeProductionRallies(
  scene: ProbableWaffleScene,
  preset: AiRuntimePresetWorldV1,
  actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): void {
  const rules = preset.productionRallies;
  if (!rules?.length) return;
  const index = getSceneService(scene, ActorIndexSystem),
    clock = getSceneService(scene, SimulationTickService),
    bus = getSceneService(scene, CommandBusService);
  if (!index || !clock || !bus) throw new Error("runtime_production_rally_services_missing");
  const applied = new Set<string>();
  const cleanup = new Subscription();
  const advance = () => {
    for (const rule of rules) {
      const target = actors.get(rule.targetFixtureActorId);
      const targetId = target && getActorComponent(target, IdComponent)?.id;
      const position = target && getActorComponent(target, RepresentableComponent)?.logicalWorldTransform;
      const tile = target && getGameObjectCurrentTile(target);
      if (
        !target?.active ||
        target.scene !== scene ||
        getActorComponent(target, HealthComponent)?.killed ||
        !targetId ||
        !position ||
        !tile ||
        getActorComponent(target, OwnerComponent)?.getOwner() !== rule.owner
      ) {
        throw new Error("runtime_production_rally_target_lost");
      }
      for (const producer of index.getOwnedActors(rule.owner)) {
        const actorId = getActorComponent(producer, IdComponent)?.id;
        const component = getActorComponent(producer, ProductionComponent);
        if (
          !actorId ||
          applied.has(actorId) ||
          producer.scene !== scene ||
          !producer.active ||
          getActorComponent(producer, HealthComponent)?.killed ||
          !component?.isFinished ||
          getCanonicalActorNameCached(producer.name) !== rule.producerObjectName
        )
          continue;
        if (applied.size >= 64) throw new Error("runtime_production_rally_capacity_exceeded");
        const control = {
          id: `rally-${actorId}`,
          playerNumber: rule.owner,
          actorId,
          requestedTick: clock.currentTick,
          scheduledTick: clock.currentTick,
          setupItemId: null
        };
        scene.events.emit(AI_RUNTIME_PRESET_CONTROL_EVENT, {
          ...control,
          phase: "requested",
          command: null,
          outcomes: []
        } satisfies AiRuntimePresetControlEvent);
        const outcomes: GameCommandOutcome[] = [];
        const listener = bus.commandOutcome$.subscribe((outcome) => outcomes.push(structuredClone(outcome)));
        try {
          const receipt = bus.dispatchDeterministic(
            {
              type: ProbableWaffleGameCommandTypes.SetRallyPoint,
              playerNumber: rule.owner,
              actorIds: [actorId],
              targetObjectId: targetId,
              tileVec3: { ...tile, z: position.z },
              worldVec3: position
            },
            "human"
          );
          if (
            receipt.status !== "dispatched" ||
            !outcomes.some(
              (outcome) => outcome.commandId === receipt.command.execution?.commandId && outcome.kind === "completed"
            )
          ) {
            throw new Error("runtime_production_rally_not_applied");
          }
          applied.add(actorId);
          scene.events.emit(AI_RUNTIME_PRESET_CONTROL_EVENT, {
            ...control,
            phase: "applied",
            command: receipt.command,
            outcomes: outcomes.filter((outcome) => outcome.commandId === receipt.command.execution?.commandId)
          } satisfies AiRuntimePresetControlEvent);
        } finally {
          listener.unsubscribe();
        }
      }
    }
  };
  advance();
  cleanup.add(clock.tick$.subscribe(advance));
  cleanup.add(scene.onShutdown.subscribe(() => cleanup.unsubscribe()));
}
