import type { NativeScenarioActor } from "./native-scenario-actor.ts";
import type { NativeScenarioWorld } from "./native-scenario-world.ts";

/** Original-world references and command authors shared by ordered scenario-family setup steps. */
export interface NativeWorldSetupContext {
  id: string;
  faction: string;
  branch: string;
  own: string;
  enemy: string;
  world: NativeScenarioWorld;
  actors: Map<string, NativeScenarioActor>;
  army: string[];
  move: (role: string, tick: number, x: number, y: number, suffix?: string) => void;
  attack: (role: string, target: string, tick: number) => void;
  loss: (role: string, tick: number) => void;
  reinforcements: (count?: number) => void;
}
