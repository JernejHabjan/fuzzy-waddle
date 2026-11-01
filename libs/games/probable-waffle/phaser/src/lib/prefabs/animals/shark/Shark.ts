import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * A map-placeable shark fin. The ordinary actor creation path attaches its identifier and registers it with
 * {@link ActorIndexSystem}; this prefab deliberately owns no movement, combat, collision, or selection state.
 * That keeps the fin usable as the typed shark signal for ambient clients without pre-committing #575's deferred
 * attack and ship-hooking rules.
 */
export default class Shark extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 8, y ?? 14, texture ?? "hunt_animals", frame ?? "Shark/fin/s.png");

    this.setOrigin(0.5, 0.875);
  }

  /** Shared identity used by actor definitions, {@link ActorIndexSystem}, and presentation consumers. */
  override name = ObjectNames.Shark;
}
