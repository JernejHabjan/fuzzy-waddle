import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";

export class FactionInfo {
  constructor(
    public factionType: FactionType,
    public name: string,
    /**
     * Actors to spawn for each player in the game
     */
    public readonly initialActors: ObjectNames[] = []
  ) {}
}
