export enum LittleMuncherHillEnum {
  Stefka = 0,
  Jakob = 1
}

export type LittleMuncherHillType = {
  [key in LittleMuncherHillEnum]: HillData;
};

export type HillData = {
  name: string;
  height: number;
};

export const LittleMuncherHills: LittleMuncherHillType = {
  [LittleMuncherHillEnum.Stefka]: {
    name: 'Stefka',
    height: 748
  },
  [LittleMuncherHillEnum.Jakob]: {
    name: 'Jakob',
    height: 806
  }
};

export interface LittleMuncherLevel {
  hill: LittleMuncherHillEnum;
}

export interface LittleMuncherGameCreate {
  level: LittleMuncherLevel;
  player_ids: string[];
}

export interface LittleMuncherGameCreateDto extends LittleMuncherGameCreate {
  gameInstanceId: string;
}
