/** Traceability row from one H-contract to implementation, persistence, debug and tests. */
export interface AiHardeningCoverageEntryV1 {
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
export const AI_HARDENING_COVERAGE_V1: readonly AiHardeningCoverageEntryV1[] = [
  {
    contractId: "H1",
    contractOwner: "AiProgressContractV1/AiBlockerV1/AiRecoveryEpisodeV1",
    implementationStages: [6, 12],
    persistencePath: "AiBrainStateV1.progress/blockers/recoveryEpisodes",
    debugField: "AiDebugSnapshotV1.progressHealth/mainBlockingReason",
    focusedTest: "validate-ai-contracts-v1.spec.ts",
    finalScenarioIds: ["H-01", "H-02", "H-03", "H-04", "H-05"]
  },
  {
    contractId: "H2",
    contractOwner: "AiWaitEdgeV1/AiReservationV1",
    implementationStages: [6, 12],
    persistencePath: "AiBrainStateV1.waitEdges/reservations",
    debugField: "AiDebugSnapshotV1.causalIndex",
    focusedTest: "validate-ai-contracts-v1.spec.ts",
    finalScenarioIds: ["H-11", "H-12", "H-13"]
  },
  {
    contractId: "H3",
    contractOwner: "AiCommandIdentityV1/AiAuthorityStateV1/AiCommandOutcomeV1",
    implementationStages: [3],
    persistencePath: "AiBrainStateV1.authority/pendingOutcomes",
    debugField: "AiDebugSnapshotV1.sections.decisionsRecovery",
    focusedTest: "ai-brain.spec.ts",
    finalScenarioIds: ["H-06", "H-07", "H-08", "H-09", "H-10"]
  },
  {
    contractId: "H4",
    contractOwner: "AiLaneServiceStateV1/AiManagerProposalV1",
    implementationStages: [6],
    persistencePath: "AiBrainStateV1.lanes",
    debugField: "AiDebugSnapshotV1.sections.runtimeLimits",
    focusedTest: "ai-brain.spec.ts",
    finalScenarioIds: ["H-14", "H-15"]
  },
  {
    contractId: "H5",
    contractOwner: "AiEconomyProductionStateV1/AiDemandV1",
    implementationStages: [7, 12],
    persistencePath: "AiBrainStateV1.economyProduction",
    debugField: "AiDebugSnapshotV1.sections.economyLabor",
    focusedTest: "Stage 7 economy focused gate",
    finalScenarioIds: ["H-16", "H-17", "H-18"]
  },
  {
    contractId: "H6",
    contractOwner: "AiPlanV1/AiSquadStateV1",
    implementationStages: [9, 13],
    persistencePath: "AiBrainStateV1.strategy/squads/progress",
    debugField: "AiDebugSnapshotV1.sections.squadsSupport",
    focusedTest: "Stage 9 mission focused gate",
    finalScenarioIds: ["H-23", "H-24", "H-25", "H-26"]
  },
  {
    contractId: "H7",
    contractOwner: "AiQueryStateV1/AiObservedAccessProductV1",
    implementationStages: [4, 8],
    persistencePath: "AiBrainStateV1.queries",
    debugField: "AiDebugSnapshotV1.sections.intelligenceEnvironment",
    focusedTest: "validate-ai-contracts-v1.spec.ts",
    finalScenarioIds: ["H-19", "H-20", "H-21", "H-22"]
  },
  {
    contractId: "H8",
    contractOwner: "AiTransportStateV1/AiFortificationStateV1",
    implementationStages: [8, 11],
    persistencePath: "AiBrainStateV1.transport/fortifications",
    debugField: "AiDebugSnapshotV1.sections.transport/basesFortifications",
    focusedTest: "Stages 8 and 11 focused gates",
    finalScenarioIds: ["H-27", "H-28", "H-29"]
  },
  {
    contractId: "H9",
    contractOwner: "assertAiBrainStateV1/AiReproBundleV1",
    implementationStages: [2, 3, 5, 14],
    persistencePath: "all AiBrainStateV1 slices and AiReproBundleV1 completeness",
    debugField: "AiDebugSnapshotV1.completeness",
    focusedTest: "parse-ai-repro-bundle.spec.ts",
    finalScenarioIds: ["H-30", "H-31", "H-32"]
  }
];
