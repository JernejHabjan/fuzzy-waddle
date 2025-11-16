import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export type BuildingPrerequisitesDefinition = {
  /**
   * List of building ObjectNames that must exist before this building can be constructed.
   * At least one building from this list must be present for construction to be allowed.
   */
  requiresAnyOf?: ObjectNames[];

  /**
   * List of building ObjectNames that ALL must exist before this building can be constructed.
   * All buildings from this list must be present for construction to be allowed.
   */
  requiresAllOf?: ObjectNames[];
};
