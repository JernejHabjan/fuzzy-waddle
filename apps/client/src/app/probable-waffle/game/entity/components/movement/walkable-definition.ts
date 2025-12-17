/**
 * Wall:
 *   walkableHeight: 64,
 *   exitHeight: 64,
 *   // can be accessed from the stairs
 *   acceptMinimumHeight: 64
 * WatchTower:
 *   walkableHeight: 128,
 *   exitHeight: 128,
 *   // can be accessed from the stairs or a wall
 *   acceptMinimumHeight: 64
 * Stairs:
 *   walkableHeight: 32,
 *   exitHeight: 64,
 *   acceptMinimumHeight: 0
 */
export interface WalkableDefinition {
  shrinkPathToRight?: number;
  shrinkPathToLeft?: number;
  /**
   * The height (in px) at which units should stand when on this object (e.g., stairs, wall, watchtower).
   * For stairs, this could be the middle height; for a watchtower, the platform height, etc.
   */
  walkableHeight?: number;

  /**
   * Height that is used when moving to different levels - for example from stairs to a wall or watchtower
   */
  exitHeight?: number;
  /**
   * Height that responds to exitHeight when moving to different levels - for example from stairs to a wall or watchtower
   * For example stairs -> watchTower or wall--> watchTower
   */
  acceptMinimumHeight?: number;
}
