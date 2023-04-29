import { GameInstanceMetadata } from '../game-instance-metadata';

export enum LittleMuncherHills {
  Stefka = 0,
  Jakob = 1
}

export interface LittleMuncherLevel {
  hillName: LittleMuncherHills;
}

export interface LittleMuncherGameCreate {
  level: LittleMuncherLevel;
  player_ids: string[];
}

export interface LittleMuncherGameCreateDto extends LittleMuncherGameCreate {
  gameInstanceId: string;
}

export class LittleMuncherGameInstanceMetadata extends GameInstanceMetadata {}
