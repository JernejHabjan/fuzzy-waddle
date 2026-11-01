import type Phaser from "phaser";

const owners = new WeakMap<Phaser.Scene, (operation: object) => number | null>();

/** Resolve only an explicitly carried native operation token, never the scene's latest event or amount. */
export function readAiRuntimeResourceOperationId(scene: Phaser.Scene, operation?: object): number | null {
  return operation ? owners.get(scene)?.(operation) ?? null : null;
}

export function installAiRuntimeResourceOperationIdentity(scene: Phaser.Scene,
  identify: (operation: object) => number | null): () => void {
  if (owners.has(scene)) throw new Error("recipient_operation_owner_duplicate");
  owners.set(scene, identify);
  return () => { if (owners.get(scene) === identify) owners.delete(scene); };
}
