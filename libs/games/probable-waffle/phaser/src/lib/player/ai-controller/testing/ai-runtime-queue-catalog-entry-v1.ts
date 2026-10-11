import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** One option advertised by an actual owned component, independently of affordability or queue admission. */
export interface AiRuntimeQueueCatalogEntryV1 {
  readonly producerActorId: string;
  readonly productKey: string;
  readonly kind: "production" | "research";
  readonly objectName: ObjectNames | null;
  readonly researchType: ResearchType | null;
  /** Shared production command deliberately reads the base cost; effective unit level is a separate authority. */
  readonly priceSource: "base_production_definition" | "research_definition";
  readonly effectiveLevel: number | null;
  readonly cost: Readonly<Partial<Record<ResourceType, number>>>;
  readonly payment: "immediate" | "per_successful_tick";
  readonly durationMs: number;
  readonly durationTicks: number;
}
