import type { ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDecisionIdentity } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-identity";
import type { AiRuntimeConstructionCatalogV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-construction-catalog-v1";

/** Command-specific placement catalog; never a global faction catalog, completed building, or paid commitment. */
export interface RuntimeConstructionCatalogEntryV1 {
  readonly placementSequence: number;
  readonly placementTick: number;
  readonly command: ConstructCommand;
  readonly siteActorId: string;
  readonly legal: boolean;
  readonly pricing: AiRuntimeConstructionCatalogV1;
  /** Only a previously established exact construction scope supplies these identities; no path means no inference. */
  readonly acceptedDecision: AiDecisionIdentity | null;
  readonly acceptedDemandId: string | null;
}
