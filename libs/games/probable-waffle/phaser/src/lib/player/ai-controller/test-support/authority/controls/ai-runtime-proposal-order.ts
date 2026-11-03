export const AI_RUNTIME_PROPOSAL_ORDER_EVENT = "ai-runtime-proposal-order";

/** First real multi-intent batch per manager, before ranking. Records identity permutation only, never replacement proposals. */
export interface AiRuntimeProposalOrder {
  readonly playerNumber: 2;
  readonly tick: number;
  readonly managerId: string;
  readonly order: "forward" | "reverse";
  readonly before: readonly string[];
  readonly after: readonly string[];
}
