export enum FlySquasherLevelEnum {
  StartSquashing = 1,
  BuzzkillBlitz = 2,
  BossyBonanza = 3,
  BeDoomed = 4
}

export type FlySquasherLevelType = {
  [key in FlySquasherLevelEnum]: LevelData;
};

export type LevelData = {
  id: FlySquasherLevelEnum;
  name: string;
  description: string;
};

export const FlySquasherLevels: FlySquasherLevelType = {
  [FlySquasherLevelEnum.StartSquashing]: {
    id: FlySquasherLevelEnum.StartSquashing,
    name: "Start Squashing",
    description: "Dive into mixed mayhem of flies and bosses."
  },
  [FlySquasherLevelEnum.BuzzkillBlitz]: {
    id: FlySquasherLevelEnum.BuzzkillBlitz,
    name: "Buzzkill Blitz",
    description: "Fast-paced fly squashing frenzy."
  },
  [FlySquasherLevelEnum.BossyBonanza]: {
    id: FlySquasherLevelEnum.BossyBonanza,
    name: "Bossy Bonanza",
    description: "Thrilling showdown against colossal flies in power struggle."
  },
  [FlySquasherLevelEnum.BeDoomed]: {
    id: FlySquasherLevelEnum.BeDoomed,
    name: "Be Doomed",
    description: "You are doomed."
  }
};

export class ScoreDto {
  constructor(
    public score: number,
    public level: FlySquasherLevelEnum,
    public userName: string,
    public userId: string,
    public date: Date = new Date()
  ) {}
}
