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
  readonly requireProductionStopsAtTarget?: boolean;
  readonly maximumQueueOccupancyPerProducer?: number;
  readonly firstOffensiveLaunchByTick?: number;
  readonly minimumOffensiveLaunchCount?: number;
  readonly minimumDamageDealt?: number;
  readonly minimumEnemyLosses?: number;
  readonly requireMissionContinuation?: boolean;
  readonly requireTerminalResult?: boolean;
  readonly requireRaidDefenseRecovery?: boolean;
  readonly requireWaterTopology?: boolean;
  readonly requireBuildableWaterCarrier?: boolean;
  readonly requiredTransportPlanId?: string;
  readonly requireTransportLifecycle?: boolean;
  readonly requireTransportCarrier?: boolean;
  readonly requireTransportBoarding?: boolean;
  readonly requireTransportHandoff?: boolean;
}
