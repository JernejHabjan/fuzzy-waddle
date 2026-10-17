import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1, AiFortificationStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

import { hasUnmetMacroFloor, isDefensiveArchetype } from "./ai-fortification-support";
import { reconcileFortificationPlan } from "./ai-fortification-recovery";
import { createFortificationPlan } from "./ai-fortification-plan";
import { createFortificationIntents, createFortificationBreachResponse } from "./ai-fortification-orders";
export {
  AI_FORTIFICATION_GRAPH_CAPS,
  AI_STANDARD_FORTIFICATION_SPEND_PERMILLE,
  AI_TURTLE_FORTIFICATION_SPEND_PERMILLE
} from "./ai-fortification-support";
export { fortificationPreservesConnectivityV1 } from "./ai-fortification-connectivity";
/**
 * Owns one bounded, persistent fortification graph per base. All candidates come from the
 * committed local topology, while shared construction remains final placement authority.
 */
export class AiFortificationManager implements AiProposalManagerV1 {
  readonly managerId = "stage-11-fortifications";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined,
    private readonly gateObjectName: ObjectNames | null = null
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) return this.empty("catalog_not_ready", false);
    const cells = observation.map?.constructionCells ?? [];
    if (!cells.length) return this.empty("construction_topology_not_ready", false);

    const reconciled = state.fortifications.map((plan) => reconcileFortificationPlan(plan, observation, state));
    const activeBases = state.bases
      .filter((base) => base.active && base.anchorPosition && base.lifecycle !== "lost")
      .sort((left, right) => left.baseId.localeCompare(right.baseId));
    const planNeedingWork = reconciled.find(
      (candidate) => candidate.lifecycle !== "active" && candidate.lifecycle !== "abandoned" && candidate.graph
    );
    const planBaseId = planNeedingWork?.graph?.baseId;
    const activeBase = planNeedingWork
      ? activeBases.find((base) => base.baseId === planBaseId)
      : activeBases.find((base) => !reconciled.some((candidate) => candidate.graph?.baseId === base.baseId));
    if (!activeBase?.anchorPosition)
      return this.result(reconciled, [], [activeBases.length ? "fortifications_stable" : "active_base_not_ready"]);

    let plan = planNeedingWork;
    if (!plan) {
      if (hasUnmetMacroFloor(state)) return this.result(reconciled, [], ["macro_survival_or_supply_floor_unmet"]);
      const createdPlan = createFortificationPlan(
        this.profile,
        this.gateObjectName,
        observation,
        { ...state, fortifications: reconciled },
        activeBase.baseId,
        activeBase.anchorPosition,
        catalog
      );
      if (!createdPlan) return this.result(reconciled, [], ["no_justified_connected_choke"]);
      plan = createdPlan;
      reconciled.push(plan);
    }

    const defendedIncident = state.skirmish.incidents.some(
      (candidate) => candidate.baseId === null || candidate.baseId === activeBase.baseId
    );
    if (
      plan.lifecycle === "breached" &&
      plan.graph &&
      !defendedIncident &&
      !isDefensiveArchetype(state.opening.archetypeId)
    ) {
      const abandoned = {
        ...plan,
        lifecycle: "abandoned" as const,
        graph: {
          ...plan.graph,
          nodes: plan.graph.nodes.map((current) =>
            current.lifecycle === "destroyed" ? { ...current, lifecycle: "abandoned" as const } : current
          ),
          breach: { ...plan.graph.breach, reason: "protected_value_no_longer_justifies_rebuild" }
        }
      };
      return this.result(
        reconciled.map((candidate) => (candidate.planId === abandoned.planId ? abandoned : candidate)),
        [],
        ["breach_abandoned_low_value"]
      );
    }

    const intents = [
      ...createFortificationIntents(this.profile, plan, observation, catalog),
      ...createFortificationBreachResponse(this.profile, plan, observation, state)
    ];
    const selectedPlan = plan;
    const plans = reconciled.map((candidate) =>
      candidate.planId === selectedPlan.planId
        ? this.markProposedEffects(candidate, intents, observation.tick)
        : candidate
    );
    return this.result(plans, intents, [
      `plan:${plan.planId}:${plan.lifecycle}`,
      `nodes:${plan.completedNodeIds.length}/${plan.nodeIds.length}`,
      `opening:${plan.graph?.openingNodeId ?? "legacy"}`
    ]);
  }

  private empty(reason: string, evaluated: boolean): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "optional_infrastructure_tech",
      evaluated,
      intents: [],
      reasons: [reason]
    };
  }

  private result(
    fortifications: readonly AiFortificationStateV1[],
    intents: readonly AiIntentV1[],
    reasons: readonly string[]
  ): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "optional_infrastructure_tech",
      evaluated: true,
      intents,
      reasons,
      statePatch: { fortifications }
    };
  }

  private markProposedEffects(
    plan: AiFortificationStateV1,
    intents: readonly AiIntentV1[],
    tick: number
  ): AiFortificationStateV1 {
    if (!plan.graph) return plan;
    const effects = new Map(
      intents
        .filter((intent) => intent.kind === "construct")
        .map((intent) => [intent.siteKey.replace(/^fortification:/, ""), intent.effectId])
    );
    const breachEffect =
      intents.find(
        (intent) => intent.kind === "move" && intent.reasonCode.startsWith("fortification:breach_defenders:")
      )?.effectId ?? null;
    return {
      ...plan,
      graph: {
        ...plan.graph,
        nodes: plan.graph.nodes.map((current) => {
          const effectId = effects.get(current.nodeId);
          return effectId ? { ...current, effectId } : current;
        }),
        breach: breachEffect ? { ...plan.graph.breach, responseEffectId: breachEffect } : plan.graph.breach
      }
    };
  }
}
