import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

const branches = {
  "PRO-03": ["future_committed", "future_abandoned"],
  "PRO-06": ["critical_exposed", "safe_served", "low_value", "no_demand"],
  "PRO-07": ["shared_contention", "cancel_pending_refund"]
} as const;

function balances(variant: Pick<RuntimeVariantResultV1, "presetInitialResourceBalances">): string {
  return JSON.stringify(Object.entries(variant.presetInitialResourceBalances).sort(([left], [right]) => left.localeCompare(right))
    .map(([owner, resources]) => [owner, Object.entries(resources).sort(([left], [right]) => left.localeCompare(right))]));
}

/** Every required faction must supply distinct causal branches; one passing subject cannot stand in for controls. */
export function evaluateRuntimeProductionPairs(
  scenarioId: string,
  assertion: RuntimeAssertionV1,
  variants: readonly Pick<RuntimeVariantResultV1, "variantId" | "aiFaction" | "mapLabel" | "seed" | "presetFixtureId" |
    "presetInitialResourceBalances" | "productionEvidence">[]
): string[] {
  if (scenarioId !== "PRO-03" && scenarioId !== "PRO-06" && scenarioId !== "PRO-07") return [];
  const failures: string[] = [];
  for (const faction of assertion.requiredAiFactions) {
    const selected = variants.filter((variant) => variant.aiFaction === faction);
    const contracts = selected.map((variant) => assertion.requiredProductionContracts?.[variant.variantId]);
    if (!branches[scenarioId].every((branch) => contracts.some((contract) =>
      contract?.scenarioId === scenarioId && contract.branch === branch))) failures.push(`${faction}:production_required_branches_missing`);
    if (scenarioId === "PRO-07") continue;
    const groups = new Map<string, typeof selected>();
    for (const variant of selected) {
      const contract = assertion.requiredProductionContracts?.[variant.variantId];
      if (contract) groups.set(contract.pairId, [...(groups.get(contract.pairId) ?? []), variant]);
    }
    for (const [pairId, pair] of groups) {
      const pairContracts = pair.flatMap((variant) => {
        const contract = assertion.requiredProductionContracts?.[variant.variantId];
        return contract ? [contract] : [];
      });
      const [leftContract, rightContract] = pairContracts;
      const [left, right] = pair;
      const required: readonly RuntimeProductionContractV1["branch"][] = scenarioId === "PRO-03" ? branches["PRO-03"]
        : pairContracts.some((contract) => contract.branch === "critical_exposed")
          ? ["critical_exposed", "safe_served"] : ["low_value", "no_demand"];
      const signatures = pairContracts.map((contract) => contract.branch);
      const compatible = (left: RuntimeProductionContractV1, right: RuntimeProductionContractV1) =>
        left.scenarioId === right.scenarioId && left.latestTick === right.latestTick &&
        left.stableForTicks === right.stableForTicks && left.producerObjectName === right.producerObjectName &&
        left.productKey === right.productKey;
      if (pair.length !== 2 || !left || !right || !leftContract || !rightContract ||
        !required.every((branch) => signatures.includes(branch)) ||
        new Set(pair.map((variant) => variant.variantId)).size !== 2 || !compatible(leftContract, rightContract)) {
        failures.push(`${faction}:${pairId}:production_pair_shape`);
        continue;
      }
      if (!left.presetFixtureId || !right.presetFixtureId ||
        Object.keys(left.presetInitialResourceBalances).length === 0 ||
        left.seed !== right.seed || left.mapLabel !== right.mapLabel || balances(left) !== balances(right) ||
        !left.productionEvidence?.pairedSetupDigest ||
        left.productionEvidence.pairedSetupDigest !== right.productionEvidence?.pairedSetupDigest) {
        failures.push(`${faction}:${pairId}:production_pair_world_mismatch`);
      }
    }
  }
  return failures;
}
