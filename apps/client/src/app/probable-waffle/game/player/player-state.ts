import { FactionInfo } from "./faction-info";
import { TeamInfo } from "./team-info";
import { PlayerStart } from "./player-start";
import { Actor } from "../entity/actor/actor";

export type PlayerActors = Actor; // todo remove?

export class PlayerState {
  constructor(
    public playerStart: PlayerStart,
    public teamInfo: TeamInfo,
    public factionInfo: FactionInfo,
    public actors: PlayerActors[] // building and units
  ) {}

  getOwnActors(): PlayerActors[] {
    return this.actors;
  }
}
