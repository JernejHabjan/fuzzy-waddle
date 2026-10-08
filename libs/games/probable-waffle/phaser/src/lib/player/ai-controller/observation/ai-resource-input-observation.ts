import type Phaser from "phaser";
import type { ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

const observers = new WeakMap<Phaser.Scene, {
  begin: (player: ProbableWafflePlayer) => ((observation: AiObservationV1) => void) | undefined;
  fence: (playerNumber: number | undefined, reason: string) => void;
}>();

/** Capture-owned passive hooks. Native input and controller mutation do not depend on a diagnostic subscriber. */
export function installAiResourceInputObserver(scene: Phaser.Scene, observer: {
  begin: (player: ProbableWafflePlayer) => ((observation: AiObservationV1) => void) | undefined;
  fence: (playerNumber: number | undefined, reason: string) => void;
}): () => void {
  if (observers.has(scene)) throw new Error("resource_input_observer_duplicate");
  observers.set(scene, observer);
  return () => { if (observers.get(scene) === observer) observers.delete(scene); };
}

export function beginAiResourceInputRead(scene: Phaser.Scene, player: ProbableWafflePlayer) {
  try { return observers.get(scene)?.begin(player); }
  catch { fenceAiResourceNeed(scene, player.playerNumber, "resource_input_reader_failed"); return undefined; }
}

export function fenceAiResourceNeed(scene: Phaser.Scene, playerNumber: number | undefined, reason: string): void {
  try { observers.get(scene)?.fence(playerNumber, reason); } catch { /* Native mutation remains authoritative. */ }
}
