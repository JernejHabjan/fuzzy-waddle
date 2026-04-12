import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export type ResourceSourceDefinition = {
  readonly resourceType: ResourceType;
  readonly maximumResources: number;
  readonly gatheringFactor: number;
  readonly maxGatherers?: number;
  readonly cooldown: number;
  /** When true, the game object is NOT destroyed on depletion. Used for farm fields that cycle. */
  readonly respawnOnDepletion?: boolean;
  /** When set, overrides the gatherer's default needsReturnToDrain for this source. */
  readonly needsReturnToDrain?: boolean;
};
