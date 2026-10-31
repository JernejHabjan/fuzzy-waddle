import type Phaser from "phaser";
import { QUEUE_MUTATION_EVENT, type QueueMutationEvent } from "./queue-mutation-event";

const mutations = new WeakMap<Phaser.Scene, number>();

/** Performs exactly the caller's existing physical mutation. Diagnostics own no queue, money or completion behavior. */
export function mutateSharedQueueItem(
  scope: Omit<QueueMutationEvent, "mutationId" | "phase">,
  mutate: () => void
): void {
  const scene = scope.producer.scene;
  if (!scene.events.listenerCount(QUEUE_MUTATION_EVENT)) { mutate(); return; }
  const mutationId = (mutations.get(scene) ?? 0) + 1;
  mutations.set(scene, mutationId);
  const emit = (phase: QueueMutationEvent["phase"]) => scene.events.emit(QUEUE_MUTATION_EVENT, {
    ...scope, mutationId, phase
  } satisfies QueueMutationEvent);
  emit("before");
  try { mutate(); }
  catch (error) { emit("threw"); throw error; }
  emit("after");
}
