import type Phaser from "phaser";
import { Subscription } from "rxjs";
import { DamageType } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { recordAiRuntimePresetEventV1 } from "./ai-runtime-browser-test-config";

/** Test-owned scheduled losses use native damage and retain the exact original identity when explicitly pinned. */
export function installAiRuntimePresetEvents(
  scene: GameProbableWaffleScene,
  preset: AiRuntimePresetWorldV1,
  createdActors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): void {
  const pendingEvents = [...(preset.events ?? [])].sort(
    (left, right) => left.tick - right.tick || left.id.localeCompare(right.id)
  );
  if (pendingEvents.length === 0) return;
  if (pendingEvents.some((event) => event.kind === "cancel_unfinished_site" && !event.fixtureActorId)) {
    throw new Error("runtime_preset_cancellation_requires_original_role");
  }
  const tickService = getSceneService(scene, SimulationTickService);
  const actorIndex = getSceneService(scene, ActorIndexSystem);
  if (!tickService || !actorIndex) throw new Error("runtime_preset_event_services_unavailable");
  const cleanup = new Subscription();
  cleanup.add(
    tickService.tick$.subscribe(() => {
      while (pendingEvents[0] && pendingEvents[0].tick <= tickService.currentTick) {
        const event = pendingEvents.shift();
        if (!event) break;
        const pinned = event.fixtureActorId ? createdActors.get(event.fixtureActorId) : undefined;
        const target = actorIndex
          .getOwnedActors(event.owner)
          .filter(
            (actor) =>
              actor.scene === scene &&
              actor.active &&
              actor.name === event.objectName &&
              (event.fixtureActorId === undefined || actor === pinned)
          )
          .sort((left, right) => {
            const leftId = getActorComponent(left, IdComponent)?.id ?? "";
            const rightId = getActorComponent(right, IdComponent)?.id ?? "";
            return leftId.localeCompare(rightId);
          })[0];
        const health = target ? getActorComponent(target, HealthComponent) : undefined;
        const actorId = target ? (getActorComponent(target, IdComponent)?.id ?? null) : null;
        const construction = target && getActorComponent(target, ConstructionSiteComponent);
        const applied = !!health && !!actorId && health.healthComponentData.health > 0 &&
          (event.kind !== "cancel_unfinished_site" || !!construction && !construction.isFinished);
        if (applied && event.kind === "cancel_unfinished_site") target?.destroy();
        else if (applied) health?.takeDamage(Number.MAX_SAFE_INTEGER, DamageType.Physical);
        recordAiRuntimePresetEventV1({
          id: event.id,
          tick: tickService.currentTick,
          affectedActors: applied ? 1 : 0,
          subjectName: event.objectName,
          affectedActorId: applied ? actorId : null
        });
      }
      if (pendingEvents.length === 0) cleanup.unsubscribe();
    })
  );
  cleanup.add(scene.onShutdown.subscribe(() => cleanup.unsubscribe()));
}
