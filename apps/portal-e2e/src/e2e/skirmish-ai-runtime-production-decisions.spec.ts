import { expect, test } from "@playwright/test";
import type { AiDecisionInputV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input-v1";
import { productionConsumedDecisionFixture } from "./skirmish-ai-runtime-production-consumed-decision-fixture";
import { normalizeRuntimeProductionDecisions } from "./skirmish-ai-runtime-production-decisions";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { productionCausalityFixture } from "./skirmish-ai-runtime-production-causality-fixture";

test.describe("consumed production decision synthetic contract tests", () => {
  test("retains empty decisions, actual cadence and cached topology without granting path/exposure credit", () => {
    const first = productionConsumedDecisionFixture();
    const second = productionConsumedDecisionFixture(25, 2, 1);
    const result = normalizeRuntimeProductionDecisions({ ...first.capture,
      facts: [first.selected, { ...second.selected, sequence: 2 }] });
    expect(result.failures).toEqual([]);
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions[1].cadence).toEqual(second.input.cadence);
    expect(result.decisions[0].fairInput.accessGraph?.generation).toBe(3);
    expect(result.decisions[0].fairInput.accessProducts[0].status).toBe("not_ready");
    expect(result.decisions[0].fairInput.visibleThreats[0]).toMatchObject({ actorId: "enemy", buildingRange: null,
      attacks: [{ range: 3, highGroundRangeBonus: 1 }] });
    expect(result.gaps).toEqual(expect.arrayContaining(["production_decision_query_not_ready",
      "production_decision_producer_reachability_missing", "production_decision_building_exposure_missing"]));
  });

  test("preserves consumed stale input and same-tick catch-up separately from configured interval", () => {
    const first = productionConsumedDecisionFixture();
    const second = productionConsumedDecisionFixture(20, 2, 1);
    const facts = [first.selected, { ...second.selected, sequence: 2 }].map((fact) => ({
      ...fact, tick: 22, decision: { ...fact.decision,
        input: { ...fact.decision.input, cadence: { ...fact.decision.input.cadence, tick: 22 } } }
    }));
    const result = normalizeRuntimeProductionDecisions({ ...first.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.decisions.map((decision) => decision.observationAgeTicks)).toEqual([2, 2]);
    expect(result.gaps).toContain("production_decision_stale_observation");
  });

  test("missing legacy/overflow/catalog/clock inputs never borrow a later checkpoint", () => {
    const f = productionConsumedDecisionFixture();
    const missing: AiDecisionInputV1[] = [
      { ...f.input, observation: null, gaps: ["production_decision_observation_overflow"] },
      { ...f.input, capabilityCatalog: null },
      { ...f.input, cadence: { ...f.input.cadence, clock: "render_fallback", tick: null } }
    ];
    for (const input of missing) {
      const result = normalizeRuntimeProductionDecisions({ ...f.capture,
        facts: [{ ...f.selected, decision: { ...f.selected.decision, input } }] });
      expect(result.failures).toEqual([]);
      expect(result.decisions).toEqual([]);
      expect(result.gaps.length).toBeGreaterThan(0);
    }
    expect(normalizeRuntimeProductionDecisions({ ...f.capture,
      facts: [{ ...f.selected, decision: { ...f.selected.decision, input: undefined } }] }).decisions).toEqual([]);
  });

  test("contradictory cadence, input identity, topology and query timestamps fail closed", () => {
    const f = productionConsumedDecisionFixture();
    if (!f.input.observation || !f.input.capabilityCatalog || !f.input.accessGraph) throw new Error("synthetic_input_missing");
    const inputs: AiDecisionInputV1[] = [
      { ...f.input, snapshotRestoreInProgress: true },
      { ...f.input, cadence: { ...f.input.cadence, tick: 21 } },
      { ...f.input, cadence: { ...f.input.cadence, configuredIntervalTicks: 0 } },
      { ...f.input, capabilityCatalog: { ...f.input.capabilityCatalog, generation: 9 } },
      { ...f.input, observation: { ...f.input.observation, playerNumber: 2 } },
      { ...f.input, accessGraph: { ...f.input.accessGraph, builtTick: 21 } },
      { ...f.input, observation: { ...f.input.observation, accessProducts:
        f.input.observation.accessProducts.map((query) => ({ ...query, updatedTick: 19 })) } },
      { ...f.input, capabilityCatalog: null, accessGraph: { ...f.input.accessGraph, builtTick: 21 } },
      { ...f.input, observation: null, accessGraph: { ...f.input.accessGraph, builtTick: 21 } }
    ];
    for (const input of inputs) {
      const result = normalizeRuntimeProductionDecisions({ ...f.capture,
        facts: [{ ...f.selected, decision: { ...f.selected.decision, input } }] });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.decisions).toEqual([]);
    }
  });

  test("regressions fail, skipped attempts remain gaps, and an invalid decision suppresses existing normalized money", () => {
    const f = productionConsumedDecisionFixture();
    const regression = { ...f.selected, sequence: 2 };
    expect(normalizeRuntimeProductionDecisions({ ...f.capture, facts: [f.selected, regression] }).failures)
      .toContain("production_decision_cadence_regressed");
    const skipped = productionConsumedDecisionFixture(30, 3, 2).selected;
    const result = normalizeRuntimeProductionDecisions({ ...f.capture, facts: [f.selected, { ...skipped, sequence: 2 }] });
    expect(result.failures).toEqual([]);
    expect(result.gaps).toContain("production_decision_cadence_incomplete");
    const raw = productionCausalityFixture();
    const invalid = { ...f.selected, tick: raw.facts[0].tick, sequence: 1,
      decision: { ...f.selected.decision, input: { ...f.input, snapshotRestoreInProgress: true } } };
    const normalized = normalizeRuntimeProductionCausality({ ...raw, facts: [invalid,
      ...raw.facts.map((fact) => ({ ...fact, sequence: fact.sequence + 1 }))] });
    expect(normalized.failures).toContain("production_decision_restore_unverified");
    expect(normalized.decisions).toEqual([]);
    expect(normalized.payments).toEqual([]);
    expect(normalized.operations).toEqual([]);
  });
});
