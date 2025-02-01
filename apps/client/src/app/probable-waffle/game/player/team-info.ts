import { PlayerController_old } from "../world/managers/controllers/player-controller_old";

export class TeamInfo {
  constructor(
    public teamId: number,
    public name: string,
    public color: string,
    public teamMembers: PlayerController_old[]
  ) {}
}
