import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export type ResourceDrainDefinition = {
  resourceTypes: ResourceType[];
  cooldown: number;
};
