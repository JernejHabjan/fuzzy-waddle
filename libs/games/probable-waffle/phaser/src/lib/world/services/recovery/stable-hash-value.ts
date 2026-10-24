/** Closed deterministic values accepted by state-hash serialization. */
export type StableSerializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly StableSerializable[]
  | { readonly [key: string]: StableSerializable };

