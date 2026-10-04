import type { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";

export type ActorIconObjectDefinition = {
  actorObjectId?: string;
  iconIndex?: number;
  researchType?: ResearchType;
  /** ID of a unit inside a container — clicking unloads it from the container. */
  containedActorId?: string;
};
