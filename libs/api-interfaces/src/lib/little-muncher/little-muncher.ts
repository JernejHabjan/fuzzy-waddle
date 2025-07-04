export enum LittleMuncherHillEnum {
  Stefka = 1,
  Jakob = 2,
  Triglav = 3,
  Razor = 4,
  Tosc = 5,
  Prisojnik = 6,
  Sneznik = 7
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
    name: "Stefka",
    height: 748
  },
  [LittleMuncherHillEnum.Jakob]: {
    name: "Jakob",
    height: 806
  },
  [LittleMuncherHillEnum.Triglav]: {
    name: "Triglav",
    height: 2864
  },
  [LittleMuncherHillEnum.Razor]: {
    name: "Razor",
    height: 2200
  },
  [LittleMuncherHillEnum.Tosc]: {
    name: "Tošč",
    height: 2085
  },
  [LittleMuncherHillEnum.Prisojnik]: {
    name: "Prisojnik",
    height: 2547
  },
  [LittleMuncherHillEnum.Sneznik]: {
    name: "Snežnik",
    height: 1796
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
