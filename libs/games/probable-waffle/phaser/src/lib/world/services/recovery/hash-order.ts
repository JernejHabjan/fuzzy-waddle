import type { StableSerializable } from "./stable-hash-value";

/** Order projection included in the authoritative state hash. */
export interface HashOrder {
  readonly orderType?: StableSerializable;
  readonly data?: {
    readonly targetGameObjectId?: StableSerializable;
    readonly targetTileLocation?: { readonly x?: number; readonly y?: number; readonly z?: number } | null;
  } | null;
}
