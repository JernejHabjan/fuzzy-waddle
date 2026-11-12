import type { NativeScenarioActor } from "./native-scenario-actor.ts";

/** Structural subset shared by the Node recipe validator and browser oracle; contains only inspected inputs. */
export interface ExpansionPressureRecipe {
  mapLabel: string;
  aiPlayerNumber: number;
  fixedStepFrames?: boolean;
  simulationTimeScale: number;
  checkpointTicks: readonly number[];
  variants: readonly {
    id: string;
    aiFaction: string;
    humanFaction: string;
    difficulty: string;
    seed: number;
    role?: string;
    pairId?: string;
    scenarioIds?: readonly string[];
    mapLabel?: string;
    checkpointTicks?: readonly number[];
    executionKind?: string;
    captureConstruction?: boolean;
    captureCombat?: boolean;
    evidenceStop?: unknown;
    presetWorld?: {
      fixtureId: string;
      requireFactionRoster?: boolean;
      actors: readonly NativeScenarioActor[];
      events?: readonly unknown[];
      constructionOrders?: readonly unknown[];
      initialOrders?: readonly unknown[];
      sourceStocks?: readonly { fixtureActorId: string; amount: number }[];
      controls?: readonly {
        id: string;
        producerFixtureActorId: string;
        requestTick: number;
        applicationTick: number;
        action: { kind: string; targetFixtureActorId?: string; worldPosition?: { x: number; y: number; z: number } };
      }[];
    };
  }[];
}
