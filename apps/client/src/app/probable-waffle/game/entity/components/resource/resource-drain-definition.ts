import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export type ResourceDrainDefinition = {
  readonly resourceTypes: ResourceType[];
  readonly cooldown: number;
};
