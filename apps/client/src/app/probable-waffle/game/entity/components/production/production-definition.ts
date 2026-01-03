import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export type ProductionDefinition = {
  availableProduceActors: ObjectNames[];
  // How many products can be produced simultaneously - for example 2 marines (SC2)
  queueCount: number;
  capacityPerQueue: number;
};
