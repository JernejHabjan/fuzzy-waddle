import { PlayerController } from './controllers/player-controller';

export class TeamInfo {
  constructor(
    public teamId: number,
    public name: string,
    public color: string,
    public teamMembers: PlayerController[]
  ) {}
}
