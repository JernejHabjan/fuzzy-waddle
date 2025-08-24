import { TechTreeComponent } from "./tech-tree";
import { FactionType, ObjectNames, Vector3Simple } from "@fuzzy-waddle/api-interfaces";

export class FactionInfo {
  constructor(
    public factionType: FactionType,
    public name: string,
    public techTreeComponent: TechTreeComponent,
    /**
     * Actors to spawn for each player in the game
     */
    public readonly initialActors: ObjectNames[] = [],

    /**
     * Relative locations of the actors to spawn for each player in the game, relative to their respective start spot
     */
    public readonly initialActorLocations: Vector3Simple[] = [],
    /**
     * Optional types of actors that are required for a player to be alive. As soon as no actor of the specified type is alive, the player is defeated
     */
    public readonly defeatConditionActorClasses: ObjectNames[] = [],

    /**
     * Units and building the ai should produce, in order
     */
    public readonly buildOrder: ObjectNames[] = [],
    public readonly includeInitialActorsInBuildOrder = true
  ) {}

  getBuildOrder(): string[] {
    const classes: any[] = [];
    if (this.includeInitialActorsInBuildOrder) {
      classes.push(...this.initialActors);
    }
    classes.push(...this.buildOrder);
    return classes;
  }
}
