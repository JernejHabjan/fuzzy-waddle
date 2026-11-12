import type { StableSerializable } from "./stable-hash-value";
import type { HashOrderData } from "./hash-order-data";

/**
 * Defines the structured hash order contract for this module. Its declared surface makes order type, data
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface HashOrder {
  /**
   * Optional discriminator for {@link HashOrder}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly orderType?: StableSerializable;
  /**
   * Optional typed data associated with {@link HashOrder}. Preserve its declared contract at serialization and
   * adapter boundaries instead of weakening it to an unstructured record.
   */
  readonly data?: HashOrderData | null;
}

