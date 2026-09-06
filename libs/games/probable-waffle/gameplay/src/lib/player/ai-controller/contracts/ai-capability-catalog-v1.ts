import type { ObjectNames, ResourceType, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDomainV1 } from "./ai-observation-v1";

/** Runtime-definition-derived capability; this catalog never copies a balance table. */
export interface AiCapabilityCatalogEntryV1 {
  readonly capabilityId: string;
  readonly family: string;
  readonly sourceObjectName: ObjectNames;
  readonly effectiveLevel: number;
  readonly movementDomains: readonly AiDomainV1[];
  readonly targetDomains: readonly AiDomainV1[];
  readonly produces: readonly ObjectNames[];
  readonly constructs: readonly ObjectNames[];
  readonly researches: readonly ResearchType[];
  readonly gathers: readonly ResourceType[];
  readonly housingCapacity: number | null;
  readonly housingCost: number | null;
  readonly cargoCapacity: number | null;
}

/** Atomic capability generation projected by the Phaser definition adapter. */
export interface AiCapabilityCatalogV1 {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly entries: readonly AiCapabilityCatalogEntryV1[];
  readonly unsupported: readonly { capabilityId: string; reason: string }[];
}
