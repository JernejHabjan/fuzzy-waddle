import { TechTreeComponent } from './tech-tree';
import { ActorAbleToBeCreatedClass } from './buildings/production-queue';
import { Vector2Simple } from './math/intersection';

export class RaceInfo {
  constructor(
    public techTreeComponent: TechTreeComponent,
    /**
     * Actors to spawn for each player in the game
     */
    public readonly initialActors: ActorAbleToBeCreatedClass[] = [],

    /**
     * Relative locations of the actors to spawn for each player in the game, relative to their respective start spot
     */
    public readonly initialActorLocations: Vector2Simple[] = [],

    /**
     * Optional types of actors that are required for a player to be alive. As soon as no actor of the specified type is alive, the player is defeated
     */
    public readonly defeatConditionActorClasses: ActorAbleToBeCreatedClass[] = [],

    /**
     * Units and buildings the AI should produce, in order
     */
    public readonly buildOrder: ActorAbleToBeCreatedClass[] = [],
    public readonly includeInitialActorsInBuildOrder = true
  ) {}
  getBuildOrder(): ActorAbleToBeCreatedClass[] {
    const classes = [];
    if (this.includeInitialActorsInBuildOrder) {
      classes.push(...this.initialActors);
    }
    classes.push(...this.buildOrder);
    return classes;
  }
}
