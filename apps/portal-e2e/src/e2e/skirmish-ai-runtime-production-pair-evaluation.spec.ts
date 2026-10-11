import { expect, test } from "@playwright/test";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import { evaluateRuntimeProductionPairs } from "./skirmish-ai-runtime-production-pair-evaluation";
import { productionContract, productionEvidence } from "./skirmish-ai-runtime-production-contract-fixtures";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

function pairData(scenarioId: RuntimeProductionContractV1["scenarioId"], branches: readonly RuntimeProductionContractV1["branch"][]) {
  const variants: Pick<RuntimeVariantResultV1, "variantId" | "aiFaction" | "mapLabel" | "seed" | "presetFixtureId" |
    "presetInitialResourceBalances" | "productionEvidence">[] = branches.map((branch) => ({
    variantId: branch, aiFaction: "Tivara", mapLabel: "AI Open Economy", seed: 759,
    presetFixtureId: branch, presetInitialResourceBalances: { 2: { wood: 300, food: 100 } },
    productionEvidence: productionEvidence([], [])
  }));
  const assertion = { minimumDecisions: 1, minimumAppliedCommands: 1, requiredAiFactions: ["Tivara"],
    requiredProductionContracts: Object.fromEntries(branches.map((branch) => [branch, { ...productionContract(scenarioId, branch),
      pairId: ["low_value", "no_demand"].includes(branch) ? "low-pair" : "main-pair" }]))
  } satisfies RuntimeAssertionV1;
  return { assertion, variants };
}

test("PRO-03 and PRO-06 require independently matched causal pairs per faction", () => {
  for (const scenarioId of ["PRO-03", "PRO-06"] as const) {
    const selected = scenarioId === "PRO-03" ? ["future_committed", "future_abandoned"] as const
      : ["critical_exposed", "safe_served", "low_value", "no_demand"] as const;
    const { assertion, variants } = pairData(scenarioId, selected);
    expect(evaluateRuntimeProductionPairs(scenarioId, assertion, variants)).toEqual([]);
    expect(evaluateRuntimeProductionPairs(scenarioId, assertion, variants.slice(0, 1)))
      .toContain("Tivara:production_required_branches_missing");
    expect(evaluateRuntimeProductionPairs(scenarioId, assertion, variants.map((variant, index) => index === 1
      ? { ...variant, seed: variant.seed + 1 } : variant))).toContain("Tivara:main-pair:production_pair_world_mismatch");
    expect(evaluateRuntimeProductionPairs(scenarioId, assertion, variants.map((variant, index) => index === 1
      ? { ...variant, presetInitialResourceBalances: { 2: { wood: 301, food: 100 } } } : variant)))
      .toContain("Tivara:main-pair:production_pair_world_mismatch");
    expect(evaluateRuntimeProductionPairs(scenarioId, assertion, variants.map((variant, index) => index === 1
      ? { ...variant, productionEvidence: { ...productionEvidence([], []), pairedSetupDigest: "different-world" } } : variant)))
      .toContain("Tivara:main-pair:production_pair_world_mismatch");
  }
});

test("PRO-07 requires both shared-lane and pending-refund worlds for each faction", () => {
  const { assertion, variants } = pairData("PRO-07", ["shared_contention", "cancel_pending_refund"]);
  expect(evaluateRuntimeProductionPairs("PRO-07", assertion, variants)).toEqual([]);
  expect(evaluateRuntimeProductionPairs("PRO-07", assertion, variants.slice(0, 1)))
    .toContain("Tivara:production_required_branches_missing");
});
