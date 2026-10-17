import type { projectRuntimeControlledOutputs } from "./skirmish-ai-runtime-controlled-output";
import type { projectRuntimeControlledRefunds } from "./skirmish-ai-runtime-production-controlled-refund";
import type { projectRuntimeControlledCommands } from "./skirmish-ai-runtime-production-controlled-commands";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
// prettier-ignore
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Native typed joins, retaining requests without fabricated money frames and every distinct teardown/refund callback. */
export interface RuntimeProductionLifecycleV2 {
  /** Real test-controller requests/application, independent of AI selection and resource callbacks. */
  readonly controlledOutputs?: ReturnType<typeof projectRuntimeControlledOutputs>;
  readonly controlledRefunds?: ReturnType<typeof projectRuntimeControlledRefunds>;
  readonly controlledCommands?: ReturnType<typeof projectRuntimeControlledCommands>["commands"];
  readonly queues: readonly (RuntimeProductionEvidenceV1["events"][number] & {
    /** Actual callback clock. Scheduled request and consumed/selected clocks remain independent. */
    readonly applicationTick: number;
    readonly selectedSequence: number | null;
  })[];
  readonly cancellationRequests: readonly {
    readonly sequence: number;
    readonly requestTick: number;
    readonly scheduledTick: number;
    readonly commandId: string;
    readonly effectId: string;
    readonly itemId: string;
  }[];
  readonly construction: RuntimeProductionCausalityV1["constructionLineage"];
  /** Lifetimes of actors actually present in paused setup, including normal preset initialization callbacks. */
  readonly setupConstruction: RuntimeProductionCausalityV1["constructionLineage"];
  readonly constructionDefinitions: RuntimeProductionCausalityV1["constructionCatalog"];
  readonly rejections: RuntimeProductionCausalityV1["rejections"];
  readonly setupPayments: AiRuntimePresetApplicationV1["queueApplications"];
  /** Actual unregister boundaries, never an inferred absence or an authored destruction schedule. */
  readonly losses: readonly Extract<AiRuntimeProductionFactV1, { kind: "actor_unregistered" }>[];
  readonly failures: readonly string[];
  readonly gaps: readonly string[];
}
