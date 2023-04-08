import { User } from '@supabase/supabase-js';
import { LittleMuncherGameInstanceCreateDto } from '@fuzzy-waddle/api-interfaces';

export class GameInstanceServer {
  public createdOn: Date;
  public createdBy: string;
  public gameInstanceId: string;

  constructor(body: LittleMuncherGameInstanceCreateDto, user: User) {
    this.createdOn = new Date();
    this.createdBy = user.id;
    this.gameInstanceId = body.gameInstanceId;
    // todo
  }
}
