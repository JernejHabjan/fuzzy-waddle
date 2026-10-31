import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

export const AI_RUNTIME_RECOVERY_SETUP_EVENT = "ai-runtime-recovery-setup";

/** Native tick-zero facts, priced from definitions independently of the planner's renewable reserve helper. */
export interface AiRuntimeRecoverySetup {
  readonly playerNumber: 2;
  readonly branch: "one_worker" | "bootstrap" | "infeasible";
  readonly workerIds: readonly string[];
  readonly workerObjectName: ObjectNames;
  /** Complete ordered missing construction closure, plus the first produced worker for zero-worker bootstrap. */
  readonly steps: readonly { readonly objectName: ObjectNames; readonly cost: Readonly<Partial<Record<ResourceType, number>>> }[];
  readonly bank: Readonly<Record<ResourceType, number>>;
  /** Every native source, including fogged sources, is audited. These facts never enter AI observations. */
  readonly sources: readonly { readonly actorId: string; readonly resourceType: ResourceType;
    readonly available: number; readonly renewable: boolean }[];
}
