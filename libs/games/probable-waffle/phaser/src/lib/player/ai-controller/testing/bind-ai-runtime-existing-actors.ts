import type Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { getCanonicalActorNameCached } from "../../../data/tech-tree/canonical-actor-name";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

/** Bind actual inherited actors before creating authored actors. Ambiguity/reuse aborts setup; no actor data is rewritten. */
export function bindAiRuntimeExistingActors(
  scene: ProbableWaffleScene,
  preset: AiRuntimePresetWorldV1,
  actors: Map<string, Phaser.GameObjects.GameObject>,
  actorIds: Record<string, string>
): void {
  if (!preset.existingActorBindings?.length) return;
  const index = getSceneService(scene, ActorIndexSystem);
  if (!index) throw new Error("runtime_preset_existing_index_missing");
  for (const binding of preset.existingActorBindings) {
    const candidates = binding.owner === null ? index.getAllIdActors() : index.getOwnedActors(binding.owner);
    const matches = candidates
      .filter(
        (actor) =>
          actor.scene === scene &&
          actor.active &&
          !getActorComponent(actor, HealthComponent)?.killed &&
          (getActorComponent(actor, OwnerComponent)?.getOwner() ?? null) === binding.owner &&
          (binding.owner !== null || !!getActorComponent(actor, ResourceSourceComponent)) &&
          getCanonicalActorNameCached(actor.name) === getCanonicalActorNameCached(binding.actorName) &&
          (!binding.position || (() => {
            const position = getGameObjectLogicalTransform(actor);
            return position?.x === binding.position.x && position?.y === binding.position.y && position?.z === binding.position.z;
          })())
      );
    const actor = matches[0];
    const id = actor && getActorComponent(actor, IdComponent)?.id;
    if (
      matches.length !== 1 ||
      !actor ||
      !id ||
      actors.has(binding.fixtureActorId) ||
      Object.values(actorIds).includes(id)
    ) {
      throw new Error(`runtime_preset_existing_binding_ambiguous:${binding.fixtureActorId}`);
    }
    actors.set(binding.fixtureActorId, actor);
    actorIds[binding.fixtureActorId] = id;
  }
}
