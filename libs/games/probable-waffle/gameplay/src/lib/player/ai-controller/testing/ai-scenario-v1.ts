import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiIntentDecisionV1, AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** Stable harness mode. Runtime cases must cross the real Phaser command/application boundary. */
export type AiScenarioDriverV1 = "pure" | "runtime";

/** Independent semantic predicates; JSON fixtures cannot execute arbitrary code. */
export type AiScenarioAssertionV1 =
  | { readonly kind: "intent_count"; readonly minimum: number; readonly maximum: number }
  | { readonly kind: "intent_action"; readonly action: string; readonly minimum: number; readonly maximum: number }
  | { readonly kind: "state_path_equals"; readonly path: string; readonly expected: string | number | boolean | null }
  | { readonly kind: "digest_equals"; readonly surface: "command" | "ai" | "world"; readonly expected: string }
  | { readonly kind: "digest_differs"; readonly surface: "command" | "ai" | "world"; readonly forbidden: string }
  | { readonly kind: "work_count_at_most"; readonly counter: string; readonly maximum: number }
  | { readonly kind: "work_count_between"; readonly counter: string; readonly minimum: number; readonly maximum: number }
  | { readonly kind: "command_applied"; readonly commandId: string; readonly deadlineTick: number }
  | { readonly kind: "world_path_equals"; readonly path: string; readonly expected: string | number | boolean | null };

/** One immutable decision input at a committed observation boundary. */
export interface AiScenarioDecisionFrameV1 {
  readonly observation: AiObservationV1;
  readonly outcomes: readonly AiCommandOutcomeV1[];
}

/** Fixture-authored expectations, including a required control/negative relationship. */
export interface AiScenarioExpectedBranchV1 {
  readonly branchId: string;
  readonly assertions: readonly AiScenarioAssertionV1[];
  readonly forbidden: readonly AiScenarioAssertionV1[];
}

/** Complete pure/runtime scenario contract resolved before candidate execution. */
export interface AiScenarioV1 {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly purpose: string;
  readonly requirementTags: readonly string[];
  readonly owningStages: readonly number[];
  readonly drivers: readonly AiScenarioDriverV1[];
  readonly seed: number;
  readonly faction: FactionType;
  readonly initialTick: number;
  readonly maxTick: number;
  readonly warmupTicks: number;
  readonly syntheticOnly: boolean;
  /** Paired worlds share a group but carry distinct fixture-authored inputs and roles. */
  readonly pairing: {
    readonly groupId: string;
    readonly variantId: string;
    readonly role: "subject" | "control" | "negative";
    readonly counterpartVariantIds: readonly string[];
  };
  readonly catalogIds: readonly string[];
  readonly initialState: AiBrainStateV1;
  readonly frames: readonly AiScenarioDecisionFrameV1[];
  readonly expectedBranches: readonly AiScenarioExpectedBranchV1[];
  readonly nonVacuity: readonly AiScenarioAssertionV1[];
}

/** Canonical record emitted per decision for exact determinism and semantic evaluation. */
export interface AiScenarioDecisionRecordV1 {
  readonly tick: number;
  readonly acceptedIntentIds: readonly string[];
  readonly acceptedIntents: readonly AiIntentV1[];
  readonly trace: readonly AiIntentDecisionV1[];
  readonly commandDigest: string;
  readonly previousAiDigest: string;
  readonly aiDigest: string;
  readonly traceDigest: string;
  readonly workCounts: Readonly<Record<string, number>>;
  /** Retained only for failed/debug runs so first-path diagnostics do not rely on digest guessing. */
  readonly diagnosticState?: unknown;
}

/** Data-only result shared by Jest, the CLI and the offline debug workbench. */
export interface AiScenarioRunReportV1 {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly driver: AiScenarioDriverV1;
  readonly seed: number;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly records: readonly AiScenarioDecisionRecordV1[];
  readonly finalAiDigest: string;
  readonly finalWorldDigest: string | null;
  readonly assertionResults: readonly {
    readonly branchId: string;
    readonly passed: boolean;
    readonly failures: readonly string[];
  }[];
}
