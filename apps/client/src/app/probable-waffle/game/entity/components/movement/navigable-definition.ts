import type { NavigablePath } from "./navigable-path";

export interface HeightDirectionPortDefinition {
  enterHeight: number;
  exitHeight: number;
}

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
   * Height that must exactly match a neighbor's exitHeight when entering this surface.
   */
  enterHeight?: number;
  /**
   * Deprecated compatibility field. Use enterHeight and directionPorts for new definitions.
   */
  acceptMinimumHeight?: number;
  /**
   * Optional per-direction height gates. Stairs and ramps use this to expose
   * low-side and high-side ports while simple surfaces can use enterHeight/exitHeight.
   */
  directionPorts?: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>>;
}
