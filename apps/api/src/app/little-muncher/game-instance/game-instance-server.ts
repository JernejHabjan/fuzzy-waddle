import { User } from '@supabase/supabase-js';
import { LittleMuncherGameInstanceCreateDto, LittleMuncherGameMode } from '@fuzzy-waddle/api-interfaces';

export class GameInstanceServer {
  public createdOn: Date;
  public createdBy: string;
  public gameInstanceId: string;
  gameMode?: LittleMuncherGameMode; // TODO!!!!!! THIS MIGHT NOT BE THE RIGHT PLACE FOR THIS

  constructor(body: LittleMuncherGameInstanceCreateDto, user: User) {
    this.createdOn = new Date();
    this.createdBy = user.id;
    this.gameInstanceId = body.gameInstanceId;
    // todo
  }
}
