import type { CampaignMissionRuntimeEvent, CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import { CAMPAIGN_CONDITION_KINDS, type CampaignConditionKind } from "../../contracts/campaign-content-kinds";
import type {
  MissionConditionDefinition,
  MissionNumericComparison
} from "../../contracts/mission-condition-definition";

export interface CampaignMissionConditionContext {
  readonly state: Readonly<CampaignMissionRuntimeState>;
  readonly event?: CampaignMissionRuntimeEvent;
}

export interface CampaignWorldConditionAdapter {
  evaluate(context: CampaignMissionConditionContext, definition: MissionConditionDefinition): boolean;
}

export interface CampaignConditionEvaluator {
  readonly kind: CampaignConditionKind;
  evaluate(context: CampaignMissionConditionContext, definition: MissionConditionDefinition): boolean;
}

export class CampaignConditionEvaluatorRegistry {
  private readonly evaluators = new Map<CampaignConditionKind, CampaignConditionEvaluator>();

  register(evaluator: CampaignConditionEvaluator): void {
    if (this.evaluators.has(evaluator.kind)) {
      throw new Error(`Campaign condition evaluator '${evaluator.kind}' is already registered`);
    }
    this.evaluators.set(evaluator.kind, evaluator);
  }

  getRequired(kind: CampaignConditionKind): CampaignConditionEvaluator {
    const evaluator = this.evaluators.get(kind);
    if (!evaluator) throw new Error(`Campaign condition evaluator '${kind}' is not registered`);
    return evaluator;
  }

  kinds(): readonly CampaignConditionKind[] {
    return [...this.evaluators.keys()].sort();
  }
}

export class CampaignConditionRuntime {
  constructor(private readonly registry: CampaignConditionEvaluatorRegistry) {}

  evaluate(context: CampaignMissionConditionContext, definition: MissionConditionDefinition): boolean {
    if (definition.kind === "all") return definition.conditions.every((child) => this.evaluate(context, child));
    if (definition.kind === "any") return definition.conditions.some((child) => this.evaluate(context, child));
    if (definition.kind === "not") return !this.evaluate(context, definition.condition);
    return this.registry.getRequired(definition.kind).evaluate(context, definition);
  }
}

export function createCampaignConditionEvaluatorRegistry(
  worldAdapter?: CampaignWorldConditionAdapter
): CampaignConditionEvaluatorRegistry {
  const registry = new CampaignConditionEvaluatorRegistry();
  const stateKinds: readonly CampaignConditionKind[] = [
    "always",
    "never",
    "fact",
    "counter",
    "timer",
    "objective",
    "phase",
    "encounter"
  ];
  for (const kind of stateKinds) registry.register(new StateCampaignConditionEvaluator(kind));
  for (const kind of CAMPAIGN_CONDITION_KINDS) {
    if (kind === "all" || kind === "any" || kind === "not" || registry.kinds().includes(kind)) continue;
    registry.register(new DelegatingCampaignConditionEvaluator(kind, worldAdapter));
  }
  return registry;
}

class StateCampaignConditionEvaluator implements CampaignConditionEvaluator {
  constructor(readonly kind: CampaignConditionKind) {}

  evaluate(context: CampaignMissionConditionContext, definition: MissionConditionDefinition): boolean {
    const state = context.state;
    switch (definition.kind) {
      case "always":
        return true;
      case "never":
        return false;
      case "fact":
        return state.facts[definition.factId] === definition.equals;
      case "counter":
        return compareMissionNumber(state.counters[definition.counterId] ?? 0, definition.comparison, definition.value);
      case "timer":
        return state.timers[definition.timerId]?.status === definition.state;
      case "objective":
        return state.objectives[definition.objectiveId]?.status === definition.state;
      case "phase":
        return definition.state === "active"
          ? state.activePhaseIds.includes(definition.phaseId)
          : state.completedPhaseIds.includes(definition.phaseId);
      case "encounter":
        return (state.encounters[definition.encounterId] ?? "inactive") === definition.state;
      default:
        throw new Error(`State condition evaluator '${this.kind}' received '${definition.kind}'`);
    }
  }
}

class DelegatingCampaignConditionEvaluator implements CampaignConditionEvaluator {
  constructor(
    readonly kind: CampaignConditionKind,
    private readonly adapter?: CampaignWorldConditionAdapter
  ) {}

  evaluate(context: CampaignMissionConditionContext, definition: MissionConditionDefinition): boolean {
    if (!this.adapter) throw new Error(`Campaign condition '${definition.kind}' has no world adapter`);
    return this.adapter.evaluate(context, definition);
  }
}

export function compareMissionNumber(left: number, comparison: MissionNumericComparison, right: number): boolean {
  switch (comparison) {
    case "equal":
      return left === right;
    case "not-equal":
      return left !== right;
    case "less":
      return left < right;
    case "less-or-equal":
      return left <= right;
    case "greater":
      return left > right;
    case "greater-or-equal":
      return left >= right;
  }
}
