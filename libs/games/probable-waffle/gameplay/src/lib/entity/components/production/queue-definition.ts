export type QueueDefinition = {
  // How many products can be produced simultaneously - for example 2 marines (SC2)
  readonly queueCount: number;
  readonly capacityPerQueue: number;
};
