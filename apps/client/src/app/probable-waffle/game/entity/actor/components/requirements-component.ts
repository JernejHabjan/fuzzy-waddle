import GameObject = Phaser.GameObjects.GameObject;
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export type RequirementsDefinition = {
  actors: ObjectNames[];
};
export class RequirementsComponent {
  // todo should use techTreeComponent maybe?

  // Types of actors the player needs to own in order to create this actor
  constructor(
    public readonly owner: GameObject,
    public readonly requirementsDefinition: RequirementsDefinition
  ) {}
}
