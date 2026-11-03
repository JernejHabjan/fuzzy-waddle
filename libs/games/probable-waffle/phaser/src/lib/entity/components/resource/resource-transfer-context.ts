/** Explicit diagnostic handles supplied by the gatherer; no ambient async ownership or saved/wire identity. */
export interface ResourceTransferContext {
  readonly cargoOwner: object;
  readonly execution?: object;
  readonly transfer: object;
}
