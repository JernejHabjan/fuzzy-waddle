import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export type ResourceSourceDefinition = {
  readonly resourceType: ResourceType;
  readonly maximumResources: number;
  readonly gatheringFactor: number;
  readonly maxGatherers?: number;
  readonly cooldown: number;
};
