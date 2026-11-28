import type { RuntimeProductionQueueMutation } from "../queues/skirmish-ai-runtime-production-queue-mutation";
import type { RuntimeProductionOperation } from "../evidence/skirmish-ai-runtime-production-operation";

/** Native cancellation lifecycle only; useful replacement, stable outcomes and full fair-world evidence remain separate. */
export interface RuntimeProductionCancellation {
  readonly commandId: string;
  readonly originatingCommandId: string;
  readonly effectId: string;
  readonly planId: string;
  readonly item: RuntimeProductionQueueMutation["item"];
  readonly actorId: string;
  readonly laneId: string;
  /** Observed request and intended bus application are independent of the physical removal/refund callbacks. */
  readonly requestedSequence: number;
  readonly requestedTick: number;
  readonly scheduledTick: number;
  readonly removal: RuntimeProductionQueueMutation;
  readonly refund: RuntimeProductionOperation;
  /** Actual immediate charge, or actual successful 50 ms charges; never estimated cumulative refund credit. */
  readonly paidOperationSequences: readonly number[];
  readonly originatingTerminalSequence: number;
  readonly cancellationTerminalSequence: number;
  readonly terminalTick: number;
}
