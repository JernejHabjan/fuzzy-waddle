import type Phaser from "phaser";

const listeners = new WeakMap<Phaser.Scene, Set<(reason: string) => void>>();

/** Passive pre-mutation boundary. Scene captures own subscriptions across restore, ownership, health and construction changes. */
export function subscribeSceneResourceLoss(scene: Phaser.Scene, callback: (reason: string) => void): () => void {
  const group = listeners.get(scene) ?? new Set();
  if (group.size >= 8) { callback("scene_resource_listener_overflow"); return () => undefined; }
  group.add(callback);
  listeners.set(scene, group);
  return () => { group.delete(callback); if (!group.size) listeners.delete(scene); };
}

/** Lose history before native callbacks/writes; one failing observer cannot suppress native work or later observers. */
export function fenceSceneResourceHistory(scene: Phaser.Scene, reason: string): void {
  [...(listeners.get(scene) ?? [])].forEach((callback) => {
    try { callback(reason); } catch { /* Observation cannot prevent native mutation. */ }
  });
}
