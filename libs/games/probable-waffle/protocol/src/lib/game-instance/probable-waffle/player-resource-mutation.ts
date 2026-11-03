import type { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { ProbableWafflePlayer } from "./probable-waffle-player";

/** Unsaved native call identity. References join an emission; detached values alone never establish provenance. */
export interface PlayerResourceMutation {
  readonly player: ProbableWafflePlayer;
  readonly operation: object;
  readonly kind: "add" | "pay";
  readonly request: Partial<Record<ResourceType, number>>;
  readonly requested: Partial<Record<ResourceType, number>> | null;
  readonly phase: "before" | "returned" | "threw";
  readonly before: Record<ResourceType, number> | null;
  readonly after: Record<ResourceType, number> | null;
  readonly bindingValid: boolean;
}
