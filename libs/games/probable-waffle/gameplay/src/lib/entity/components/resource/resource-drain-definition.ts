import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

export type ResourceDrainDefinition = {
  readonly resourceTypes: ResourceType[];
  readonly cooldown: number;
};
