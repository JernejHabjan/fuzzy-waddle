import { RaceInfo } from './race-info';
import { TeamInfo } from './team-info';
import { PlayerStart } from './player-start';
import { PlayerResourcesComponent } from './controllers/player-resources-component';
import { Ownable } from './characters/owner-component';
import { Actor } from './actor';

export type PlayerActors = Actor & Ownable;
export class PlayerState {
  constructor(
    public playerStart: PlayerStart,
    public teamInfo: TeamInfo,
    public raceInfo: RaceInfo,
    public resources: PlayerResourcesComponent,
    public actors: PlayerActors[] // buildings and units
  ) {}

  getOwnActors() :PlayerActors[]{
    return this.actors;
  }
}
