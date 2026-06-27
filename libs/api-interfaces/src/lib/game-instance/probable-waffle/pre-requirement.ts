import type { ObjectNames } from "./object-names";
import type { ResearchType } from "./research-type";

export type PreRequirementType = {
  objectNames: ObjectNames[];
  researchTypes: ResearchType[];
  resources: Partial<Record<string, number>>;
  supply: number | null;
};

export class PreRequirement {
  constructor(
    private _prereqs: PreRequirementType = {
      objectNames: [],
      researchTypes: [],
      resources: {},
      supply: null
    }
  ) {}
  public get prereqs(): PreRequirementType {
    return this._prereqs;
  }

  public get canProduce(): boolean {
    return (
      this._prereqs.objectNames.length === 0 &&
      this._prereqs.researchTypes.length === 0 &&
      Object.keys(this._prereqs.resources).length === 0 &&
      (this._prereqs.supply === null || this._prereqs.supply <= 0)
    );
  }

  public get canQueue(): boolean {
    return this.canProduce;
  }
}
