import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

/** Synthetic digest input only; never an application/world fixture or accepted production evidence. */
export function productionCheckpoint(tick: number, itemId: string): RuntimeCheckpointV1 {
  return {
    targetTick: tick, tick, observationTick: tick, decisionSequence: 1, faction: 1, openingPlanId: "opening",
    openingSteps: {}, workerCount: 0, deliveredIncome: 0, appliedCommands: [], terminalFailureCount: 0,
    terminalFailureReasons: {}, recentCommandFailures: [], ownedActorNames: [], rawOwnedActorNames: [], ownedConstruction: [],
    workerOrders: [], workerConstructs: {}, constructionCellCount: 0, legalConstructionCellCount: 0,
    ownedMainBuildingNames: [], sceneComponentNames: [], mapBoundsStatus: "known", resourceStockpiles: {},
    recentMacroDecisions: [], accessTopology: { status: "known", groundNodes: 0, waterNodes: 0, airNodes: 0, shoreTransfers: 0 },
    carrierCatalog: [], mobileTransports: [], transportPlans: [], transportDecisions: [], transportOutcomes: [],
    profileDifficulty: null, strategyStance: "defend", visibleEnemyFacts: [], decisionFacts: [], demands: [],
    militaryActorNames: [], militaryProducerNames: ["barracks"], squads: [], objectiveContacts: [], adaptationEvidence: [],
    bases: [], reservations: [], missionTimeline: [], modeGoals: [], scoreMetrics: {}, gameResult: null,
    militaryProducerQueues: [{ actorId: "producer", objectName: "barracks", capacity: 5, occupied: 1,
      queuedObjectNames: ["frontline"], queuedItems: [{ itemId, kind: "production", objectName: "frontline", researchType: null }] }]
  };
}
