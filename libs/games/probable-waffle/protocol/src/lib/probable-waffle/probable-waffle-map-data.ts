import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ProbableWaffleLightingConfig } from "./probable-waffle-lighting-config";
import type { ProbableWaffleMapKey } from "./probable-waffle-map-key";
import type { ProbableWaffleMapEnum } from "./probable-waffle-map-enum";

/**
 * Defines the structural probable waffle map data contract. Its declared surface makes id, dev/test visibility, name,
 * loader, presentation explicit to every consumer. This named alias keeps the boundary explicit without
 * duplicating an anonymous object shape.
 */
export type ProbableWaffleMapData = {
  /**
   * stable id used by {@link ProbableWaffleMapData} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id: ProbableWaffleMapEnum;
  /**
   * Optional dev only value carried by {@link ProbableWaffleMapData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  devOnly?: boolean;
  /** Only the explicit AI runtime-test lobby may offer this map; it is excluded from ordinary map browsing. */
  testOnly?: boolean;
  /**
   * human-facing name for {@link ProbableWaffleMapData}. It supports UI, narration, or diagnostics and must not
   * be used as the stable identity of the record.
   */
  name: string;
  /**
   * keyed/nested loader structure owned by {@link ProbableWaffleMapData}. Keep its keys and value contract
   * explicit so callers cannot smuggle a broader shape across this boundary.
   */
  loader: {
    /**
     * stable map scene key used by {@link ProbableWaffleMapData} to correlate this value with related records,
     * events, or authored content; it is not a display label.
     */
    mapSceneKey: ProbableWaffleMapKey;
    /**
     * string map loader asset pack path carried by {@link ProbableWaffleMapData}. Treat it according to the owning
     * contract’s validation and presentation rules rather than assuming it is a stable identifier.
     */
    mapLoaderAssetPackPath: string;
  };
  /**
   * keyed/nested presentation structure owned by {@link ProbableWaffleMapData}. Keep its keys and value contract
   * explicit so callers cannot smuggle a broader shape across this boundary.
   */
  presentation: {
    /**
     * human-facing description for {@link ProbableWaffleMapData}. It supports UI, narration, or diagnostics and
     * must not be used as the stable identity of the record.
     */
    description: string;
    /**
     * string image path carried by {@link ProbableWaffleMapData}. Treat it according to the owning contract’s
     * validation and presentation rules rather than assuming it is a stable identifier.
     */
    imagePath: string;
  };
  /**
   * collection value on {@link ProbableWaffleMapData}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  mapInfo: {
    /**
     * collection value on {@link ProbableWaffleMapData}. Its element type defines the records that may cross this
     * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    startPositionsOnTile: Vector3Simple[];
    /**
     * numeric width tiles carried by {@link ProbableWaffleMapData}. Its units and valid range are defined by
     * {@link ProbableWaffleMapData} and must remain consistent across producers and consumers.
     */
    widthTiles: number;
    /**
     * numeric height tiles carried by {@link ProbableWaffleMapData}. Its units and valid range are defined by
     * {@link ProbableWaffleMapData} and must remain consistent across producers and consumers.
     */
    heightTiles: number;
  };
  /**
   * Optional lighting value carried by {@link ProbableWaffleMapData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  lighting?: ProbableWaffleLightingConfig;
};
