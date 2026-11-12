import type { NativeScenarioActor } from "./native-scenario-actor.ts";

/** Mutable original roster and definition-name factories; setup helpers preserve their original order. */
export interface NativeActorLayoutContext {
  id: string;
  own: string;
  enemy: string;
  branch: string;
  actors: NativeScenarioActor[];
  wall: boolean;
  placement: boolean;
  tile: (x: number, y: number) => NativeScenarioActor["position"];
  actor: (role: string, name: string, owner: number | null, x: number, y: number) => NativeScenarioActor;
  melee: (faction: string) => string;
  ranged: (faction: string) => string;
  producer: (faction: string) => string;
  caster: (faction: string) => string;
}
