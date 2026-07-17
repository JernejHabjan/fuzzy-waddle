import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export interface PathMoveConfig {
  radiusTilesAroundDestination?: number;
  onUpdateThrottle?: number;
  onComplete?: () => void;
  onPathUpdate?: (newTileXY: Vector2Simple) => void;
  onUpdateThrottled?: () => void;
  onUpdate?: () => void;
  onStop?: () => void;
  ignoreAnimations?: boolean;
}
