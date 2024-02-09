import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

export class RallyPoint {
  constructor(
    // Location to send new actors to
    public vec3?: Vector3Simple,
    // Actor to send new actors to
    public actor?: GameObject
  ) {}
}
