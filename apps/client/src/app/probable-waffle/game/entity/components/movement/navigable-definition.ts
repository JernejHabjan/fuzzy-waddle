export interface NavigableDefinition {
  shrinkPathToRight?: number;
  shrinkPathToLeft?: number;
  /**
   * The height (in px) at which units should stand when on this object (e.g., stairs, wall, watchtower).
   * For stairs, this could be the middle height; for a watchtower, the platform height, etc.
   */
  navigableHeight?: number;

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
