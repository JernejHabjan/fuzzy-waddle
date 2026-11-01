import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Fixed native source/beneficiary and effect window; optional worker/deposit bindings prevent interchangeable service credit. */
export interface RuntimeSourceDeliveryContract {
  readonly sourceActorId: string;
  readonly sourceOwner: number | null;
  readonly playerNumber: number;
  readonly resourceType: ResourceType;
  readonly fromTick: number;
  readonly throughTick: number;
  readonly workerActorId?: string;
  readonly depositActorId?: string;
}
