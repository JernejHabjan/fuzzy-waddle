import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeCargoContributionV1 } from "./skirmish-ai-runtime-cargo-contribution";
import type { RuntimeServiceAttemptV1 } from "./skirmish-ai-runtime-service-attempt";

/** Exact scoped credit, independently from native return and full-pile provenance. Neither flag means task fulfillment. */
export interface RuntimeResourceCreditV1 {
  readonly fact: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
  readonly offer: RuntimeResourceCreditV1["fact"] | null;
  readonly consumption: RuntimeResourceCreditV1["fact"] | null;
  readonly delivery: RuntimeServiceAttemptV1 | null;
  /** Null is unavailable/suppressed application. Zero is an observed zero-credit interval, never positive income. */
  readonly appliedAmount: number | null;
  readonly beneficiary: number | null;
  /** Complete observed whole pile, including removal. Unknown/mixed/interrupted/partial piles cannot borrow later tasks. */
  readonly cargoAttributed: boolean;
  readonly contributions: readonly RuntimeCargoContributionV1[];
  readonly gaps: readonly string[];
}
