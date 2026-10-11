import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionProgressFixture } from "./skirmish-ai-runtime-production-progress-fixture";
import { validateRuntimeProductionProgress } from "./skirmish-ai-runtime-production-progress";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

test.describe("production progress synthetic contract tests", () => {
  test("checks the actual-shaped successful step, final charge and initially zero-time head including waiting lanes", () => {
    for (const remaining of [100, 50, 0]) {
      const { capture, command } = productionProgressFixture("advanced", remaining);
      expect(validateRuntimeProductionProgress(capture, [command])).toEqual({ failures: [], gaps: [] });
    }
  });

  test("a denied attempt preserves cash, physical progress and every remaining successful charge", () => {
    const { capture, command } = productionProgressFixture("denied");
    expect(validateRuntimeProductionProgress(capture, [command])).toEqual({ failures: [], gaps: [] });
  });

  test("an absent end, substituted callback, wrong cash or residual final charge fails closed", () => {
    for (const mutation of ["end", "callback", "remaining", "cash", "liability", "baseline", "epoch", "restore"] as const) {
      const { capture, command } = productionProgressFixture("advanced", 50);
      const facts = capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
        if (mutation === "end" && fact.kind === "queue_progress" && fact.progress.phase === "advanced") return [];
        if (mutation === "callback" && fact.kind === "queue_resource" && fact.resource.emission.phase === "callback") return [];
        if (mutation === "epoch" && fact.kind === "queue_resource") return [{ ...fact, resource: { ...fact.resource,
          originatingCommandContext: fact.resource.originatingCommandContext ? { ...fact.resource.originatingCommandContext,
            execution: { ...fact.resource.originatingCommandContext.execution, authorityEpoch: 99 } } : null } }];
        if (mutation === "baseline" && fact.kind === "queue_progress" && fact.boundaryState?.obligations) return [{ ...fact,
          boundaryState: { ...fact.boundaryState, obligations: { ...fact.boundaryState.obligations,
            food: fact.boundaryState.obligations.food + 100 } } }];
        if (fact.kind !== "queue_progress" || fact.progress.phase !== "advanced") return [fact];
        if (mutation === "restore") return [{ ...fact, progress: { ...fact.progress, snapshotRestoreInProgress: true } }];
        if (mutation === "remaining") return [{ ...fact, progress: { ...fact.progress,
          item: fact.progress.item ? { ...fact.progress.item, remainingTimeMs: 1 } : null } }];
        const state = fact.boundaryState;
        if (!state) throw new Error("synthetic_boundary_missing");
        return [{ ...fact, boundaryState: { ...state,
          resources: mutation === "cash" && state.resources ? { ...state.resources, food: 100 } : state.resources,
          obligations: mutation === "liability" && state.obligations ? { ...state.obligations, food: 18 } : state.obligations
        } }];
      });
      expect(validateRuntimeProductionProgress({ ...capture, facts }, [command]).failures.length).toBeGreaterThan(0);
    }
  });

  test("missing callback-state authority stays a gap and existing report diagnostics retain the progress records", () => {
    const { capture, command } = productionProgressFixture();
    const facts = capture.facts.map((fact) => ({ ...fact, boundaryState: undefined }));
    expect(validateRuntimeProductionProgress({ ...capture, facts }, [command]).gaps)
      .toContain("production_ai_progress_boundary_missing");
    const result = normalizeRuntimeProductionCausality(capture);
    expect(result.operationBoundaries.filter((fact) => fact.kind === "queue_progress")).toHaveLength(2);
    expect(result.gaps).toContain("production_ai_progress_command_missing");
    expect(result.gaps).toContain("production_ai_event_liabilities_missing");
    expect(result).not.toHaveProperty("productionEvidence");
  });
});
