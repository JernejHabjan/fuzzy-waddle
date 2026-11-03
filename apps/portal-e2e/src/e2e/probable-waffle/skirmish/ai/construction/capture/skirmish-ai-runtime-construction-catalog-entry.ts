import type { ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDecisionIdentity } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/decision/ai-decision-identity";
import type { AiRuntimeConstructionCatalog } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/construction/ai-runtime-construction-catalog";

/** Command-specific placement catalog; never a global faction catalog, completed building, or paid commitment. */
export interface RuntimeConstructionCatalogEntry {
  readonly placementSequence: number;
  readonly placementTick: number;
  readonly command: ConstructCommand;
  readonly siteActorId: string;
  readonly legal: boolean;
  readonly pricing: AiRuntimeConstructionCatalog;
  /** Only an exact validated path/lifecycle admission scope supplies these identities; site/name/price equality cannot. */
  readonly acceptedDecision: AiDecisionIdentity | null;
  readonly acceptedDemandId: string | null;
}
