import { TechTreeComponent } from "./tech-tree";
import { FactionType } from "./faction-definitions";
import { ActorType } from "../entity/assets/types/actor-type";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";

export class FactionInfo {
  constructor(
    public factionType: FactionType,
    public name: string,
    public techTreeComponent: TechTreeComponent,
    /**
     * Actors to spawn for each player in the game
     */
    public readonly initialActors: ActorType[] = [], // todo query then ActorTypeLookup constant

    /**
     * Relative locations of the actors to spawn for each player in the game, relative to their respective start spot
     */
    public readonly initialActorLocations: Vector3Simple[] = [],
    /**
     * Optional types of actors that are required for a player to be alive. As soon as no actor of the specified type is alive, the player is defeated
     */
    public readonly defeatConditionActorClasses: ActorType[] = [], // todo query then ActorTypeLookup constant

    /**
     * Units and building the ai should produce, in order
     */
    public readonly buildOrder: ActorType[] = [], // todo query then ActorTypeLookup constant
    public readonly includeInitialActorsInBuildOrder = true
  ) {}

  getBuildOrder(): ActorType[] {
    const classes: any[] = [];
    if (this.includeInitialActorsInBuildOrder) {
      classes.push(...this.initialActors);
    }
    classes.push(...this.buildOrder);
    return classes;
  }
}
