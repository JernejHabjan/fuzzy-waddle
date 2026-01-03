import { ActorPhysicalType } from "./actor-physical-type";

export type HealthDefinition = {
  maxHealth: number;
  maxArmour?: number;
  regenerateHealthRate?: number;
  healthDisplayBehavior?: "always" | "onDamage";
  physicalState: ActorPhysicalType;
};
