import Phaser from "phaser";

/** Actor objects that expose world coordinates for ambient proximity queries. */
export type PositionedActor = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.GameObjects.Container;

export function isPositionedActor(actor: Phaser.GameObjects.GameObject): actor is PositionedActor {
  return actor instanceof Phaser.GameObjects.Sprite ||
    actor instanceof Phaser.GameObjects.Image ||
    actor instanceof Phaser.GameObjects.Container;
}
