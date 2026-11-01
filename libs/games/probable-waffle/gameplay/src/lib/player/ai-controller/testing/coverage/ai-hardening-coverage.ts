/** Traceability row from one H-contract to implementation, persistence, debug and tests. */
export interface AiHardeningCoverageEntry {
  readonly contractId: `H${number}`;
  readonly contractOwner: string;
  readonly implementationStages: readonly number[];
  readonly persistencePath: string;
  readonly debugField: string;
  readonly focusedTest: string;
  readonly finalScenarioIds: readonly `H-${string}`[];
}

/**
 * Coverage authority for H1–H9. Stage 2 defines the shared contracts; the listed owning
 * stages add runtime behavior while preserving these persistence/debug/test identities.
 */
export const AI_HARDENING_COVERAGE: readonly AiHardeningCoverageEntry[] = [
  {
    contractId: "H1",
    contractOwner: "AiProgressContract/AiBlocker/AiRecoveryEpisode",
    implementationStages: [6, 12],
    persistencePath: "AiBrainState.progress/blockers/recoveryEpisodes",
    debugField: "AiDebugSnapshot.progressHealth/mainBlockingReason/recovery",
    focusedTest: "ai-recovery-manager.spec.ts",
    finalScenarioIds: ["H-01", "H-02", "H-03", "H-04", "H-05"]
  },
  {
    contractId: "H2",
    contractOwner: "AiWaitEdge/AiReservation",
    implementationStages: [6, 12],
    persistencePath: "AiBrainState.waitEdges/reservations",
    debugField: "AiDebugSnapshot.causalIndex",
    focusedTest: "validate-ai-contracts.spec.ts",
    finalScenarioIds: ["H-11", "H-12", "H-13"]
  },
  {
    contractId: "H3",
    contractOwner: "AiCommandIdentity/AiAuthorityState/AiCommandOutcome",
    implementationStages: [3],
    persistencePath: "AiBrainState.authority/pendingOutcomes",
    debugField: "AiDebugSnapshot.sections.decisionsRecovery",
    focusedTest: "ai-brain.spec.ts",
    finalScenarioIds: ["H-06", "H-07", "H-08", "H-09", "H-10"]
  },
  {
    contractId: "H4",
    contractOwner: "AiLaneServiceState/AiManagerProposal",
    implementationStages: [6],
    persistencePath: "AiBrainState.lanes",
    debugField: "AiDebugSnapshot.sections.runtimeLimits",
    focusedTest: "ai-brain.spec.ts",
    finalScenarioIds: ["H-14", "H-15"]
  },
  {
    contractId: "H5",
    contractOwner: "AiEconomyProductionState/AiDemand",
    implementationStages: [7, 12],
    persistencePath: "AiBrainState.economyProduction",
    debugField: "AiDebugSnapshot.sections.economyLabor",
    focusedTest: "ai-recovery-manager.spec.ts",
    finalScenarioIds: ["H-16", "H-17", "H-18"]
  },
  {
    contractId: "H6",
    contractOwner: "AiPlan/AiSquadState",
    implementationStages: [9, 13],
    persistencePath: "AiBrainState.strategy/squads/progress",
    debugField: "AiDebugSnapshot.sections.squadsSupport",
    focusedTest: "ai-tactics-manager.spec.ts",
    finalScenarioIds: ["H-23", "H-24", "H-25", "H-26"]
  },
  {
    contractId: "H7",
    contractOwner: "AiQueryState/AiObservedAccessProduct",
    implementationStages: [4, 8],
    persistencePath: "AiBrainState.queries",
    debugField: "AiDebugSnapshot.sections.intelligenceEnvironment",
    focusedTest: "validate-ai-contracts.spec.ts",
    finalScenarioIds: ["H-19", "H-20", "H-21", "H-22"]
  },
  {
    contractId: "H8",
    contractOwner: "AiTransportState/AiFortificationState",
    implementationStages: [8, 11],
    persistencePath: "AiBrainState.transport/fortifications",
    debugField: "AiDebugSnapshot.sections.transport/basesFortifications",
    focusedTest: "Stages 8 and 11 focused gates",
    finalScenarioIds: ["H-27", "H-28", "H-29"]
  },
  {
    contractId: "H9",
    contractOwner: "assertAiBrainState/AiReproBundle",
    implementationStages: [2, 3, 5, 13, 14],
    persistencePath: "all AiBrainState slices and AiReproBundle completeness",
    debugField: "AiDebugSnapshot.completeness",
    focusedTest: "ai-brain.spec.ts + ai-repro-cli.spec.ts + ai-incident-capture-store.spec.ts",
    finalScenarioIds: ["H-30", "H-31", "H-32"]
  }
];
