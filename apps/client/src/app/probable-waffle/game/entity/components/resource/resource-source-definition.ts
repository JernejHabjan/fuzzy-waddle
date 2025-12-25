import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export type ResourceSourceDefinition = {
  resourceType: ResourceType;
  maximumResources: number;
  gatheringFactor: number;
  maxGatherers?: number;
  cooldown: number;
};
