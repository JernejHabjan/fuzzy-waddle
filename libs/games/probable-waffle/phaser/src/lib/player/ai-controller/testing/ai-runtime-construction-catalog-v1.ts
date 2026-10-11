import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** One placement-time price observation; neither admission nor configured payment proves a resource charge. */
export interface AiRuntimeConstructionCatalogV1 {
  readonly priceSource: "shared_command_base_definition";
  /** Exact vector already checked by the shared construction command, before site creation and assignment. */
  readonly admissionCost: Readonly<Partial<Record<ResourceType, number>>>;
  /** Same definition selection as ConstructionSiteComponent at this boundary; future start/progress may select again. */
  readonly siteDefinition: {
    readonly researchedLevel: number;
    readonly cost: Readonly<Partial<Record<ResourceType, number>>>;
    readonly configuredPayment: "immediate" | "per_successful_tick";
    /** Milliseconds of required construction work, not wall time or a fixed completion deadline. */
    readonly requiredWorkMs: number;
  } | null;
}
