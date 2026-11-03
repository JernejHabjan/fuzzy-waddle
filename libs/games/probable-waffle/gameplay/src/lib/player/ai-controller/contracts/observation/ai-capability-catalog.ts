import type { ObjectNames, ResourceType, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDomain } from "./ai-observation";

/** Runtime-definition-derived capability; this catalog never copies a balance table. */
export interface AiCapabilityCatalogEntry {
  readonly capabilityId: string;
  readonly family: string;
  readonly sourceObjectName: ObjectNames;
  readonly effectiveLevel: number;
  readonly movementDomains: readonly AiDomain[];
  readonly targetDomains: readonly AiDomain[];
  readonly produces: readonly ObjectNames[];
  readonly constructs: readonly ObjectNames[];
  readonly researches: readonly ResearchType[];
  readonly gathers: readonly ResourceType[];
  /** ResourceDrain-backed drop-off compatibility; absent in catalogs captured before this projection. */
  readonly acceptsResources?: readonly ResourceType[];
  readonly housingCapacity: number | null;
  readonly housingCost: number | null;
  readonly cargoCapacity: number | null;
  /** Definition-backed timing; absent on older captures, which cannot promise a future production deadline. */
  readonly productionTiming?: Readonly<{
    readonly durationTicks: number;
    /** Physical parallel queues, not backlog slots. */
    readonly lanes: number;
    /** Construction duration with one assigned builder and automatic progress, or null for non-buildings. */
    readonly singleBuilderTicks: number | null;
  }>;
  /** Definition-derived construction and elevated-navigation facts; absent for legacy catalogs. */
  readonly constructionProfile?: Readonly<{
    /** True when native progress requires worker assignment; absent in older authored catalogs. */
    readonly requiresAssignedBuilder?: boolean;
    readonly resourceCost: Readonly<Partial<Record<ResourceType, number>>>;
    readonly requiredObjectNames?: readonly ObjectNames[];
    /** Radius used by the runtime's square `getTileCoordsUnderObject` footprint rule. */
    readonly footprintRadiusTiles: number;
    readonly visionRange: number | null;
    readonly navigableHeight: number | null;
    readonly enterHeight: number | null;
    readonly exitHeight: number | null;
  }>;
}

/** Atomic capability generation projected by the Phaser definition adapter. */
export interface AiCapabilityCatalog {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly entries: readonly AiCapabilityCatalogEntry[];
  readonly unsupported: readonly { capabilityId: string; reason: string }[];
}
