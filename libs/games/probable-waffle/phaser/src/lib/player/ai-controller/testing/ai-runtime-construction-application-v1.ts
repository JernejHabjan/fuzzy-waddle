import type { ConstructCommand, GameCommandOutcome, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Actual shared admission/site identity and synchronous cash samples; these do not invent payment/completion. */
export interface AiRuntimeConstructionApplicationV1 {
  readonly fixtureActorId: string;
  readonly siteActorId: string;
  readonly command: ConstructCommand;
  readonly outcomes: readonly GameCommandOutcome[];
  readonly resourcesBefore: Readonly<Record<ResourceType, number>>;
  readonly resourcesAfter: Readonly<Record<ResourceType, number>>;
}
