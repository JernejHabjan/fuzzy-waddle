import type { ProbableWaffleMapData } from "./probable-waffle-map-data";
import type { ProbableWaffleMapEnum } from "./probable-waffle-map-enum";

/**
 * Defines the probable waffle map type alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWaffleMapType = {
  [key in ProbableWaffleMapEnum]: ProbableWaffleMapData;
};
