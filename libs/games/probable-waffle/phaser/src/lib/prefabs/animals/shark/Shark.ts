import Phaser from "phaser";
import { onObjectReady } from "../../../data/game-object-helper";
import { SharkBehavior } from "./shark-behavior";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/** Water animal whose behavior is attached after actor systems are ready. */
export default class Shark extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 8, y ?? 14, texture ?? "hunt_animals", frame ?? "Shark/fin/s.png");

    this.setOrigin(0.5, 0.875);
    onObjectReady(this, this.init, this);
  }

  private init(): void {
    new SharkBehavior(this);
  }

  /** Shared identity used by actor definitions, {@link ActorIndexSystem}, and presentation consumers. */
  override name = ObjectNames.Shark;
}
