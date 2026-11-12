import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { OwnerComponent } from "../owner-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { QUEUE_COMPLETION_AUTHORITY_EVENT, type QueueCompletionAuthorityEvent } from "./queue-completion-authority-event";

const completions = new WeakMap<Phaser.Scene, number>();

/** Invokes the existing synchronous authority exactly once; retains its result/throw without adding async continuations. */
export function observeQueueCompletionAuthority(
  scope: Pick<QueueCompletionAuthorityEvent, "producer" | "item">,
  complete: () => Phaser.GameObjects.GameObject | undefined
): Phaser.GameObjects.GameObject | undefined {
  const scene = scope.producer.scene;
  if (!scene.events.listenerCount(QUEUE_COMPLETION_AUTHORITY_EVENT)) return complete();
  const completionId = (completions.get(scene) ?? 0) + 1;
  completions.set(scene, completionId);
  const emit = (phase: QueueCompletionAuthorityEvent["phase"], createdActor: Phaser.GameObjects.GameObject | null = null) => {
    let researchRegistered: boolean | null = null;
    if (scope.item.researchData) {
      const owner = getActorComponent(scope.producer, OwnerComponent)?.getOwner();
      const tech = getSceneService(scene, TechTreeService);
      if (owner !== undefined && tech) researchRegistered = tech.isResearched(owner, scope.item.researchData);
    }
    scene.events.emit(QUEUE_COMPLETION_AUTHORITY_EVENT, {
      ...scope, completionId, phase, createdActor, researchRegistered
    } satisfies QueueCompletionAuthorityEvent);
  };
  emit("before");
  let result: Phaser.GameObjects.GameObject | undefined;
  try { result = complete(); }
  catch (error) { emit("threw"); throw error; }
  emit("after", result ?? null);
  return result;
}
