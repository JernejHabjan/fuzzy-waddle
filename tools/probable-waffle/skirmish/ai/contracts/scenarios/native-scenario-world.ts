import type { NativeScenarioActor } from "./native-scenario-actor.ts";

/** Mutable authoring input, before the browser validates and seals its runtime preset. */
export interface NativeScenarioWorld {
  fixtureId: string;
  requireFactionRoster: boolean;
  actors: NativeScenarioActor[];
  existingActorBindings: {
    fixtureActorId: string;
    actorName: string;
    owner: number | null;
    position?: { x: number; y: number; z: number };
  }[];
  resourceGrants: { playerNumber: number; amounts: Record<string, number> }[];
  resourceStarts: { playerNumber: number; amounts: Record<string, number> }[];
  controls: {
    id: string;
    producerFixtureActorId: string;
    requestTick: number;
    applicationTick: number;
    action: {
      kind: string;
      actorName?: string;
      targetFixtureActorId?: string;
      spellType?: string;
      setupQueueIndex?: number;
      worldPosition?: { x: number; y: number; z: number };
    };
  }[];
  events: {
    id: string;
    tick: number;
    kind: string;
    owner?: number;
    objectName?: string;
    fixtureActorId?: string;
    damage?: number;
    membership?: string;
  }[];
  initialOrders: { workerFixtureActorId: string; sourceFixtureActorId: string; kind: string }[];
  protectedRoutes?: {
    id: string;
    playerNumber: number;
    tileMargin: number;
    from: { x: number; y: number; z?: number };
    to: { x: number; y: number; z?: number };
  }[];
  terrainPatches: { x: number; y: number; terrain: string; blocked: boolean }[];
  terrainPreserveFootprints?: boolean;
  constructionOrders?: {
    fixtureActorId: string;
    actorName: string;
    builderFixtureActorIds: string[];
    position: { x: number; y: number; z: number };
  }[];
  healthStarts?: { fixtureActorId: string; healthPermille: number; armourPermille: number }[];
  completedResearch?: { playerNumber: number; researchType: string }[];
  researchQueues?: { producerFixtureActorId: string; researchType: string }[];
  queues?: { producerFixtureActorId: string; actorName: string; count: number }[];
  sourceStocks?: { fixtureActorId: string; amount: number }[];
  productionRallies?: { producerObjectName: string; owner: number; targetFixtureActorId: string }[];
  routeOutages?: {
    id: string;
    fromTick: number;
    throughTick: number;
    fixtureActorIds: string[];
    membership?: string;
    mode?: string;
  }[];
  proposalOrder?: string;
  recoveryStart?: string;
  brainFault?: { kind: string; playerNumber: number; fromTick: number; throughTick: number };
  receiptFault?: {
    id?: string;
    commandKind: string;
    playerNumber: number;
    fromTick: number;
    throughTick: number;
    maximumCommands?: number;
    holdHistory?: boolean;
    destroyOutput?: boolean;
    contendQueue?: boolean;
  };
}
