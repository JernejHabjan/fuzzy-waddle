import { ConstructableDefinition } from "./constructable-category";

export type BuilderDefinition = {
  // types of building the gameObject can produce
  readonly constructableBuildings: ConstructableDefinition;
  // Whether the builder enters the building site while working on it, or not.
  readonly enterConstructionSite: boolean;
  // from how far a builder builds building site
  readonly constructionSiteOffset: number;
};
