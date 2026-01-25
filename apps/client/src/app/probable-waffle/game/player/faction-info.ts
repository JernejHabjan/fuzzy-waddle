import { ConstructionStateEnum, FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";

export interface InitialActorConfig {
  actorName: ObjectNames;
  /**
   * Optional construction state. Defaults to Finished.
   * Use NotStarted or Constructing to spawn buildings that need to be constructed.
   */
  constructionState?: ConstructionStateEnum;
}

export class FactionInfo {
  constructor(
    public factionType: FactionType,
    public name: string,
    /**
     * Actors to spawn for each player in the game.
     */
    public readonly initialActors: InitialActorConfig[] = []
  ) {}
}
