import { ActorPhysicalType } from "./actor-physical-type";

export type HealthDefinition = {
  readonly maxHealth: number;
  readonly maxArmour?: number;
  /** Health restored once per second by the actor's deterministic simulation clock. */
  readonly regenerateHealthRate?: number;
  readonly healthDisplayBehavior?: "always" | "onDamage";
  readonly physicalState?: ActorPhysicalType;
};
