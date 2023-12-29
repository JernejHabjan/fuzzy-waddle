import { Actor } from "../actor";

export class RequirementsComponent {
  // todo should use techTreeComponent maybe?

  // Types of actors the player needs to own in order to create this actor
  constructor(public requiredActors: (typeof Actor)[] = []) {}
}
