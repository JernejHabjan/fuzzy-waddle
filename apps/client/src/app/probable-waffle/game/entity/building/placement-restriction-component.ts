import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

// makes sure that the gameObject can only be placed on a certain class (on minerals)
export class PlacementRestrictionComponent {
  constructor(
    private readonly gameObject: GameObject,
    private readonly canPlaceOn: string[]
  ) {}

  /**
   * Checks if we can place gameObject on tileXY
   */
  canPlace(vector: Vector3Simple): boolean {
    // todo
    return false;
  }
}
