import { TechTreeComponent } from './tech-tree';
import { Vector2Simple } from './math/intersection';
import { RaceType } from './race-definitions';
import { ActorType } from './characters/actor-type';

export class RaceInfo {
  constructor(
    public raceType: RaceType,
    public techTreeComponent: TechTreeComponent,
    /**
     * Actors to spawn for each player in the game
     */
    public readonly initialActors: ActorType[] = [], // todo query then ActorTypeLookup constant

    /**
     * Relative locations of the actors to spawn for each player in the game, relative to their respective start spot
     */
    public readonly initialActorLocations: Vector2Simple[] = [],

    /**
     * Optional types of actors that are required for a player to be alive. As soon as no actor of the specified type is alive, the player is defeated
     */
    public readonly defeatConditionActorClasses: ActorType[] = [], // todo query then ActorTypeLookup constant

    /**
     * Units and buildings the AI should produce, in order
     */
    public readonly buildOrder: ActorType[] = [], // todo query then ActorTypeLookup constant
    public readonly includeInitialActorsInBuildOrder = true
  ) {}
  getBuildOrder(): ActorType[] {
    const classes = [];
    if (this.includeInitialActorsInBuildOrder) {
      classes.push(...this.initialActors);
    }
    classes.push(...this.buildOrder);
    return classes;
  }
}
