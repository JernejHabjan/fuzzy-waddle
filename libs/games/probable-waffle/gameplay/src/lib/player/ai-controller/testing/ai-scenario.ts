import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCommandOutcome } from "../contracts/ai-command-contracts";
import type { AiIntentDecision, AiIntent } from "../contracts/ai-intent";
import type { AiObservation } from "../contracts/ai-observation";

/** Stable harness mode. Runtime cases must cross the real Phaser command/application boundary. */
export type AiScenarioDriver = "pure" | "runtime";

/** Independent semantic predicates; JSON fixtures cannot execute arbitrary code. */
export type AiScenarioAssertion =
  | { readonly kind: "intent_count"; readonly minimum: number; readonly maximum: number }
  | { readonly kind: "intent_action"; readonly action: string; readonly minimum: number; readonly maximum: number }
  | { readonly kind: "state_path_equals"; readonly path: string; readonly expected: string | number | boolean | null }
  | { readonly kind: "digest_equals"; readonly surface: "command" | "ai" | "world"; readonly expected: string }
  | { readonly kind: "digest_differs"; readonly surface: "command" | "ai" | "world"; readonly forbidden: string }
  | { readonly kind: "work_count_at_most"; readonly counter: string; readonly maximum: number }
  | {
      readonly kind: "work_count_between";
      readonly counter: string;
      readonly minimum: number;
      readonly maximum: number;
    }
  | { readonly kind: "command_applied"; readonly commandId: string; readonly deadlineTick: number }
  | { readonly kind: "world_path_equals"; readonly path: string; readonly expected: string | number | boolean | null };

/** One immutable decision input at a committed observation boundary. */
export interface AiScenarioDecisionFrame {
  readonly observation: AiObservation;
  readonly outcomes: readonly AiCommandOutcome[];
}

/** Fixture-authored expectations, including a required control/negative relationship. */
export interface AiScenarioExpectedBranch {
  readonly branchId: string;
  readonly assertions: readonly AiScenarioAssertion[];
  readonly forbidden: readonly AiScenarioAssertion[];
}

/** Complete pure/runtime scenario contract resolved before candidate execution. */
export interface AiScenario {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly purpose: string;
  readonly requirementTags: readonly string[];
  readonly owningStages: readonly number[];
  readonly drivers: readonly AiScenarioDriver[];
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
  readonly initialState: AiBrainState;
  readonly frames: readonly AiScenarioDecisionFrame[];
  readonly expectedBranches: readonly AiScenarioExpectedBranch[];
  readonly nonVacuity: readonly AiScenarioAssertion[];
}

/** Canonical record emitted per decision for exact determinism and semantic evaluation. */
export interface AiScenarioDecisionRecord {
  readonly tick: number;
  readonly acceptedIntentIds: readonly string[];
  readonly acceptedIntents: readonly AiIntent[];
  readonly trace: readonly AiIntentDecision[];
  readonly commandDigest: string;
  readonly previousAiDigest: string;
  readonly aiDigest: string;
  readonly traceDigest: string;
  readonly workCounts: Readonly<Record<string, number>>;
  /** Retained only for failed/debug runs so first-path diagnostics do not rely on digest guessing. */
  readonly diagnosticState?: unknown;
}

/** Data-only result shared by Jest, the CLI and the offline debug workbench. */
export interface AiScenarioRunReport {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly driver: AiScenarioDriver;
  readonly seed: number;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly records: readonly AiScenarioDecisionRecord[];
  readonly finalAiDigest: string;
  readonly finalWorldDigest: string | null;
  readonly assertionResults: readonly {
    readonly branchId: string;
    readonly passed: boolean;
    readonly failures: readonly string[];
  }[];
}
