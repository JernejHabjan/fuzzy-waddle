import type { ResourceType } from "../../probable-waffle/resource-type-definition";

/**
 * Defines the player state resources alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type PlayerStateResources = {
  [key in ResourceType]: number;
};
