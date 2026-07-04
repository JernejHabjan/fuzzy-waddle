import { ActorPhysicalType } from "./actor-physical-type";

export type HealthDefinition = {
  readonly maxHealth: number;
  readonly maxArmour?: number;
  readonly regenerateHealthRate?: number;
  readonly healthDisplayBehavior?: "always" | "onDamage";
  readonly physicalState?: ActorPhysicalType;
};
