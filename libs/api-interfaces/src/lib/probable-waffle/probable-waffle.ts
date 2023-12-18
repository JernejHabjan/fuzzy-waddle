export enum ProbableWaffleLevelEnum {
  RiverCrossing = 1,
  EmberEnclave = 2
}

export type ProbableWaffleLevelType = {
  [key in ProbableWaffleLevelEnum]: ProbableWaffleLevelData;
};

export type ProbableWaffleLevelData = {
  id: ProbableWaffleLevelEnum;
  name: string;
  description: string;
  sceneKey: string;
  assetPath: string;
};

export const ProbableWaffleLevels: ProbableWaffleLevelType = {
  [ProbableWaffleLevelEnum.RiverCrossing]: {
    id: ProbableWaffleLevelEnum.RiverCrossing,
    name: "River Crossing",
    description: "Todo",
    sceneKey: "MapRiverCrossing",
    assetPath: "asset-pack-probable-waffle-river-crossing.json"
  },
  [ProbableWaffleLevelEnum.EmberEnclave]: {
    id: ProbableWaffleLevelEnum.EmberEnclave,
    name: "Ember Enclave",
    description: "Todo",
    sceneKey: "MapEmberEnclave",
    assetPath: "asset-pack-probable-waffle-ember-enclave.json"
  }
};
