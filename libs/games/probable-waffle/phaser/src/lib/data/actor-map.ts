import type Phaser from "phaser";

/** Prefab constructors keyed by the stable runtime actor name. */
export type ActorMap = { [name: string]: new (scene: Phaser.Scene) => Phaser.GameObjects.GameObject };
