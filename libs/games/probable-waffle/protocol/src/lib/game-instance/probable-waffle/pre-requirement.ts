import type { ObjectNames } from "./object-names";
import type { ResearchType } from "./research-type";

/**
 * Defines the structural pre requirement type contract. Its declared surface makes object names, research
 * types, resources, supply, campaign restriction explicit to every consumer. This named alias keeps the
 * boundary explicit without duplicating an anonymous object shape.
 */
export type PreRequirementType = {
  /**
   * collection value on {@link PreRequirementType}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  objectNames: ObjectNames[];
  /**
   * collection value on {@link PreRequirementType}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  researchTypes: ResearchType[];
  /**
   * resources value carried by {@link PreRequirementType}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resources: Partial<Record<string, number>>;
  /**
   * supply value carried by {@link PreRequirementType}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  supply: number | null;
  /**
   * Optional string campaign restriction carried by {@link PreRequirementType}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  campaignRestriction?: string;
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
      this._prereqs.campaignRestriction === undefined &&
      (this._prereqs.supply === null || this._prereqs.supply <= 0)
    );
  }

  public get canQueue(): boolean {
    return this.canProduce;
  }
}
