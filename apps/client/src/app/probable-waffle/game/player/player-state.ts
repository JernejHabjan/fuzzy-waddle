import { RaceInfo } from './race-info';
import { TeamInfo } from './team-info';
import { PlayerStart } from './player-start';
import { PlayerResourcesComponent } from '../world/managers/controllers/player-resources-component';
import { Ownable } from '../entity/actor/components/owner-component';
import { Actor } from '../entity/actor/actor';

export type PlayerActors = Actor & Ownable;

export class PlayerState {
  constructor(
    public playerStart: PlayerStart,
    public teamInfo: TeamInfo,
    public raceInfo: RaceInfo,
    public resources: PlayerResourcesComponent,
    public actors: PlayerActors[] // building and units
  ) {}

  getOwnActors(): PlayerActors[] {
    return this.actors;
  }
}
