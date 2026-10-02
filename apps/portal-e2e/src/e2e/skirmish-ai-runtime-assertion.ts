import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";

export interface RuntimeAssertionV1 {
  readonly maximumTick?: number;
  readonly minimumDecisions: number;
  readonly minimumAppliedCommands: number;
  readonly requiredOpeningSteps?: readonly string[];
  readonly requireNoInitialWorker?: boolean;
  readonly requireDeliveredIncome?: boolean;
  readonly requiredAiFactions: readonly RuntimeVariantV1["aiFaction"][];
  readonly minimumMilitaryCount?: number;
  readonly minimumMilitaryTypeCount?: number;
  readonly minimumRepeatedMilitaryTypeCount?: number;
  readonly minimumMilitaryProducerCount?: number;
  readonly maximumMilitaryProducerCount?: number;
  readonly requireCompositionDemand?: boolean;
  readonly requireCapacityDemand?: boolean;
  readonly requiredProductionCapacity?: {
    readonly latestTick: number;
    readonly producerObjectNameByFaction: Readonly<Record<RuntimeVariantV1["aiFaction"], string>>;
  };
  readonly requireProductionStopsAtTarget?: boolean;
  /** Independent unit, command and seeded-queue proof, followed by a full no-excess observation window. */
  readonly requiredProductionComposition?: {
    /** Both branches must reach this checkpoint; no evidence-stop opt-in is permitted. */
    readonly latestTick: number;
    /** Required settled duration after the subject fills its deficit. */
    readonly stableForTicks: number;
    /** Declared force target shared by the deficient subject and both controls. */
    readonly targetMilitaryCount: number;
    /** Useful copies absent from the subject's starting world and supplied by either control branch. */
    readonly additionalUnitCount: number;
    /** Definition-backed useful unit whose repeated production is under test. */
    readonly unitObjectNameByFaction: Readonly<Record<RuntimeVariantV1["aiFaction"], string>>;
  };
  readonly maximumQueueOccupancyPerProducer?: number;
  readonly firstOffensiveLaunchByTick?: number;
  readonly minimumOffensiveLaunchCount?: number;
  readonly minimumDamageDealt?: number;
  readonly minimumEnemyLosses?: number;
  readonly requireMissionContinuation?: boolean;
  readonly requireAiVictory?: boolean;
  readonly requiredGroundRouteVariantIds?: readonly string[];
  readonly requireRaidDefenseRecovery?: boolean;
  readonly requiredPresetFixtureId?: string;
  readonly requireProducerReplacementAfterLoss?: boolean;
  readonly requiredSupplyPrebuild?: {
    readonly minimumBuffer: number;
    readonly latestTick: number;
    readonly housingObjectName: string;
  };
  readonly requireSupplyControl?: boolean;
  readonly requirePressureResponse?: boolean;
  readonly requiredResourceService?: {
    readonly sourceObjectName: string;
    readonly serviceObjectName: string;
    readonly resourceType: string;
    readonly maximumTileDistance: number;
    readonly latestTick: number;
  };
  readonly requiredSaturatedSource?: {
    readonly saturatedFixtureActorId: string;
    readonly spareFixtureActorId: string;
    readonly resourceType: string;
    readonly capacity: number;
    readonly latestTick: number;
  };
  readonly requiredResourceLabor?: {
    readonly playerNumber: number;
    readonly resourceType: string;
    readonly latestTick: number;
  };
  readonly requiredWorkerGrowth?: {
    readonly variantId: string;
    readonly initialWorkerCount: number;
    readonly minimumPeakWorkerCount: number;
    readonly minimumFinalWorkerCount: number;
    readonly latestTick: number;
  };
  readonly requiredDefenseTargetName?: string;
  readonly requiredDefenseActorName?: string;
  readonly requireMissionRedirectionAfterRaid?: boolean;
  readonly requireHiddenStateParity?: boolean;
  readonly requiredHiddenActorName?: string;
  readonly requireWaterTopology?: boolean;
  readonly requireBuildableWaterCarrier?: boolean;
  readonly requiredTransportPlanId?: string;
  readonly requireTransportLifecycle?: boolean;
  readonly requireTransportCarrier?: boolean;
  readonly requireTransportBoarding?: boolean;
  readonly requireTransportHandoff?: boolean;
}
