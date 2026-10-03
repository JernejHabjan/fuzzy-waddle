const branches = {
  "PRO-03": ["future_committed", "future_abandoned"],
  "PRO-06": ["critical_exposed", "safe_served", "low_value", "no_demand"],
  "PRO-07": ["shared_contention", "cancel_pending_refund"]
};
const contractKeys = new Set([
  "scenarioId", "latestTick", "stableForTicks", "branch", "producerObjectName", "productKey", "pairId"
]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0 && value === value.trim();
}

/**
 * Parse-time contract shape/coverage only. Definition legality, applied identities and causal setup equality remain
 * independent runtime obligations. Missing contracts on legacy natural rows remain migration debt at that gate.
 */
export function validProductionContracts(recipe, assertion, scenarioId) {
  const contracts = assertion.requiredProductionContracts;
  const allowed = branches[scenarioId];
  if (!allowed || !record(contracts) || !Array.isArray(recipe.variants) || !Array.isArray(assertion.requiredAiFactions)) return false;
  const variants = recipe.variants.filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId));
  if (!variants.length || Object.keys(contracts).length !== variants.length ||
      Object.keys(contracts).some((id) => !variants.some((variant) => variant.id === id))) return false;
  for (const variant of variants) {
    const contract = contracts[variant.id];
    const ticks = variant.checkpointTicks ?? recipe.checkpointTicks;
    if (!record(contract) || Object.keys(contract).some((key) => !contractKeys.has(key)) ||
        contract.scenarioId !== scenarioId || !allowed.includes(contract.branch) ||
        !Number.isSafeInteger(contract.latestTick) || !Number.isSafeInteger(contract.stableForTicks) ||
        contract.stableForTicks < 1 || contract.latestTick <= contract.stableForTicks ||
        !Array.isArray(ticks) || !ticks.includes(contract.latestTick) ||
        (assertion.maximumTick !== undefined && contract.latestTick > assertion.maximumTick) ||
        !nonempty(contract.producerObjectName) || !nonempty(contract.productKey) || !nonempty(contract.pairId) ||
        variant.evidenceStop !== undefined ||
        (scenarioId !== "PRO-07" && contract.pairId !== variant.pairId)) return false;
  }
  for (const faction of assertion.requiredAiFactions) {
    const selected = variants.filter((variant) => variant.aiFaction === faction);
    if (!allowed.every((branch) => selected.some((variant) => contracts[variant.id].branch === branch))) return false;
    if (scenarioId === "PRO-07") {
      // These are distinct queue worlds, rather than a false paired single-variable comparison.
      if (selected.some((variant) => variant.role !== "standalone")) return false;
      continue;
    }
    const pairs = new Map();
    for (const variant of selected) {
      const members = pairs.get(variant.pairId) ?? [];
      members.push(variant);
      pairs.set(variant.pairId, members);
    }
    for (const pair of pairs.values()) {
      if (pair.length !== 2) return false;
      const [left, right] = pair.map((variant) => contracts[variant.id]);
      const expected = scenarioId === "PRO-03" ? allowed :
        [left.branch, right.branch].includes("critical_exposed") ? ["critical_exposed", "safe_served"] : ["low_value", "no_demand"];
      if (!expected.every((branch) => [left.branch, right.branch].includes(branch)) ||
          left.latestTick !== right.latestTick || left.stableForTicks !== right.stableForTicks ||
          left.producerObjectName !== right.producerObjectName || left.productKey !== right.productKey) return false;
    }
  }
  return true;
}
