import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiScenarioAssertionV1 } from "./ai-scenario-v1";

/** Candidate-independent facts supplied by a pure or runtime driver to the semantic oracle. */
export interface AiScenarioOracleFactsV1 {
  readonly intents: readonly AiIntentV1[];
  readonly state: unknown;
  readonly world: unknown;
  readonly digests: Readonly<Record<"command" | "ai" | "world", string>>;
  readonly workCounts: Readonly<Record<string, number>>;
  readonly appliedCommands: readonly { readonly commandId: string; readonly terminalTick: number }[];
}

/** Evaluates a fixture-authored assertion without consulting the production planner. */
export function evaluateAiScenarioAssertionV1(
  assertion: AiScenarioAssertionV1,
  facts: AiScenarioOracleFactsV1
): string | null {
  switch (assertion.kind) {
    case "intent_count":
      return inBand(facts.intents.length, assertion.minimum, assertion.maximum)
        ? null
        : `intent_count:${facts.intents.length}:expected:${assertion.minimum}..${assertion.maximum}`;
    case "intent_action": {
      const count = facts.intents.filter((intent) => intent.kind === assertion.action).length;
      return inBand(count, assertion.minimum, assertion.maximum)
        ? null
        : `intent_action:${assertion.action}:${count}:expected:${assertion.minimum}..${assertion.maximum}`;
    }
    case "state_path_equals":
      return equals(readPath(facts.state, assertion.path), assertion.expected) ? null : `state_path:${assertion.path}`;
    case "world_path_equals":
      return equals(readPath(facts.world, assertion.path), assertion.expected) ? null : `world_path:${assertion.path}`;
    case "digest_equals":
      return facts.digests[assertion.surface] === assertion.expected ? null : `digest_equals:${assertion.surface}`;
    case "digest_differs":
      return facts.digests[assertion.surface] !== assertion.forbidden ? null : `digest_differs:${assertion.surface}`;
    case "work_count_at_most":
      return (facts.workCounts[assertion.counter] ?? 0) <= assertion.maximum ? null : `work_count:${assertion.counter}`;
    case "work_count_between": {
      const count = facts.workCounts[assertion.counter] ?? 0;
      return inBand(count, assertion.minimum, assertion.maximum)
        ? null
        : `work_count:${assertion.counter}:${count}:expected:${assertion.minimum}..${assertion.maximum}`;
    }
    case "command_applied": {
      const command = facts.appliedCommands.find((entry) => entry.commandId === assertion.commandId);
      return command && command.terminalTick <= assertion.deadlineTick
        ? null
        : `command_applied:${assertion.commandId}`;
    }
  }
}

function inBand(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function equals(left: unknown, right: unknown): boolean {
  return left === right || (Number.isNaN(left) && Number.isNaN(right));
}

function readPath(value: unknown, path: string): unknown {
  if (!/^\$?(\.[A-Za-z0-9_-]+)*$/.test(path)) return undefined;
  let current = value;
  for (const segment of path
    .replace(/^\$\.?/, "")
    .split(".")
    .filter(Boolean)) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) return undefined;
    current = (current as Readonly<Record<string, unknown>>)[segment];
  }
  return current;
}
