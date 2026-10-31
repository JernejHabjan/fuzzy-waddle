import type { GameCommand, GameCommandOutcome, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** One synchronous setup command, sampled around shared application. This is not a resource-event attribution hook. */
export interface AiRuntimePresetQueueApplicationV1 {
  readonly producerFixtureActorId: string;
  readonly itemId: string;
  readonly command: GameCommand;
  /** Only outcomes emitted inside this dispatch scope and matching the stamped command/actor are retained. */
  readonly outcomes: readonly GameCommandOutcome[];
  readonly resourcesBefore: Readonly<Record<ResourceType, number>>;
  readonly resourcesAfter: Readonly<Record<ResourceType, number>>;
}
