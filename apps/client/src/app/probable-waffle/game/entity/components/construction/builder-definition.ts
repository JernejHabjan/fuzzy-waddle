import { ConstructableDefinition } from "./constructable-category";

export type BuilderDefinition = {
  // types of building the gameObject can produce
  constructableBuildings: ConstructableDefinition;
  // Whether the builder enters the building site while working on it, or not.
  enterConstructionSite: boolean;
  // from how far a builder builds building site
  constructionSiteOffset: number;
};
