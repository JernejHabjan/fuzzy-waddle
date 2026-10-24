import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Detached actual native mutation boundaries. Operation IDs belong to one capture; begin and terminal count once. */
export interface AiRuntimeRecipientMutationV1 {
  readonly operationId: number;
  readonly action: "add" | "pay";
  readonly phase: "before" | "returned" | "threw";
  readonly entrySequence: number;
  readonly requested: Partial<Record<ResourceType, number>> | null;
  readonly before: Record<ResourceType, number> | null;
  readonly after: Record<ResourceType, number> | null;
  readonly bindingValid: boolean;
  readonly lossEpoch: number;
}
