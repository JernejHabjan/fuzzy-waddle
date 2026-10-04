import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { QUEUE_PROGRESS_EVENT, type QueueProgressEvent } from "./queue-progress-event";

const attempts = new WeakMap<Phaser.Scene, number>();

/** Performs the existing pay-then-decrement/clamp step. A denied/throwing payment never advances the live item. */
export function advanceSharedQueueItem(
  producer: Phaser.GameObjects.GameObject,
  item: UnifiedQueueItem,
  deltaMs: number,
  pay: () => boolean
): boolean {
  const scene = producer.scene;
  const observed = scene.events.listenerCount(QUEUE_PROGRESS_EVENT) > 0;
  if (!observed) {
    if (!pay()) return false;
    item.remainingTime -= deltaMs;
    item.remainingTime = Math.max(item.remainingTime, 0);
    return true;
  }
  const attemptId = (attempts.get(scene) ?? 0) + 1;
  attempts.set(scene, attemptId);
  const remainingBeforeMs = item.remainingTime;
  const emit = (phase: QueueProgressEvent["phase"]) => {
    scene.events.emit(QUEUE_PROGRESS_EVENT, {
      producer, item, attemptId, phase, deltaMs, remainingBeforeMs
    } satisfies QueueProgressEvent);
  };
  emit("started");
  let paid: boolean;
  try { paid = pay(); }
  catch (error) { emit("threw"); throw error; }
  if (!paid) { emit("denied"); return false; }
  item.remainingTime -= deltaMs;
  item.remainingTime = Math.max(item.remainingTime, 0);
  emit("advanced");
  return true;
}
