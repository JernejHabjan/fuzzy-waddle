import type { StableSerializable } from "./stable-hash-value";

/**
 * Defines the structured hash order data contract for this module. Its declared surface makes target game
 * object id, target tile location explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface HashOrderData {
  /**
   * Optional stable target game object id used by {@link HashOrderData} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly targetGameObjectId?: StableSerializable;
  /**
   * Optional keyed/nested target tile location structure owned by {@link HashOrderData}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  readonly targetTileLocation?: {
    readonly x?: number;
    readonly y?: number;
    readonly z?: number;
  } | null;
}

