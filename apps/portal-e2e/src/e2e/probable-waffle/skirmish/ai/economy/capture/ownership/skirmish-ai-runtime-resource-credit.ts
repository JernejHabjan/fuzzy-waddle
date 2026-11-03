import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeCargoContribution } from "../../service/skirmish-ai-runtime-cargo-contribution";
import type { RuntimeServiceAttempt } from "../../service/skirmish-ai-runtime-service-attempt";

/** Exact scoped credit, independently from native return and full-pile provenance. Neither flag means task fulfillment. */
export interface RuntimeResourceCredit {
  readonly fact: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
  readonly offer: RuntimeResourceCredit["fact"] | null;
  readonly consumption: RuntimeResourceCredit["fact"] | null;
  readonly delivery: RuntimeServiceAttempt | null;
  /** Null is unavailable/suppressed application. Zero is an observed zero-credit interval, never positive income. */
  readonly appliedAmount: number | null;
  readonly beneficiary: number | null;
  /** Complete observed whole pile, including removal. Unknown/mixed/interrupted/partial piles cannot borrow later tasks. */
  readonly cargoAttributed: boolean;
  readonly contributions: readonly RuntimeCargoContribution[];
  readonly gaps: readonly string[];
}
