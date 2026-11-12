import type { projectRuntimeControlledOutputs } from "../../contracts/skirmish-ai-runtime-controlled-output";
import type { projectRuntimeControlledRefunds } from "../resources/skirmish-ai-runtime-production-controlled-refund";
import type { projectRuntimeControlledCommands } from "../authority/skirmish-ai-runtime-production-controlled-commands";
import type { RuntimeProductionCausality } from "../decisions/skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidence } from "../evidence/skirmish-ai-runtime-production-evidence";
// prettier-ignore
import type { AiRuntimePresetApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-application";
// prettier-ignore
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";

/** Native typed joins, retaining requests without fabricated money frames and every distinct teardown/refund callback. */
export interface RuntimeNativeProductionLifecycle {
  /** Real test-controller requests/application, independent of AI selection and resource callbacks. */
  readonly controlledOutputs?: ReturnType<typeof projectRuntimeControlledOutputs>;
  readonly controlledRefunds?: ReturnType<typeof projectRuntimeControlledRefunds>;
  readonly controlledCommands?: ReturnType<typeof projectRuntimeControlledCommands>["commands"];
  readonly queues: readonly (RuntimeProductionEvidence["events"][number] & {
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
  readonly construction: RuntimeProductionCausality["constructionLineage"];
  /** Lifetimes of actors actually present in paused setup, including normal preset initialization callbacks. */
  readonly setupConstruction: RuntimeProductionCausality["constructionLineage"];
  readonly constructionDefinitions: RuntimeProductionCausality["constructionCatalog"];
  readonly rejections: RuntimeProductionCausality["rejections"];
  readonly setupPayments: AiRuntimePresetApplication["queueApplications"];
  /** Actual unregister boundaries, never an inferred absence or an authored destruction schedule. */
  readonly losses: readonly Extract<AiRuntimeProductionFact, { kind: "actor_unregistered" }>[];
  readonly failures: readonly string[];
  readonly gaps: readonly string[];
}
