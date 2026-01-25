import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export type ProductionDefinition = {
  readonly availableProduceActors: ObjectNames[];
  // How many products can be produced simultaneously - for example 2 marines (SC2)
  readonly queueCount: number;
  readonly capacityPerQueue: number;
};
