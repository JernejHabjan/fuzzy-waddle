export enum LittleMuncherHill {
  Stefka = 0,
  Jakob = 1
}

export interface LittleMuncherLevel {
  hill: LittleMuncherHill;
}

export interface LittleMuncherGameCreate {
  level: LittleMuncherLevel;
  player_ids: string[];
}

export interface LittleMuncherGameCreateDto extends LittleMuncherGameCreate {
  gameInstanceId: string;
}
