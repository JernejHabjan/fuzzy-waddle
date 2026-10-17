/** Recipe requirements for native economy proof; IDs/branches cannot disappear through a typo or empty contract map. */
export function validEconomyContracts(recipe, assertion, scenarioId) {
  const contracts = assertion.requiredEconomyContracts;
  if (!contracts || typeof contracts !== "object" || Array.isArray(contracts)) return false;
  const variants = recipe.variants.filter(
    (variant) => !variant.scenarioIds || variant.scenarioIds.includes(scenarioId)
  );
  const branches = scenarioId === "ECO-05" ? ["aggregate_budget", "surplus_transfer"] : ["poor_delivery"];
  return (
    recipe.fixedStepFrames === true &&
    recipe.simulationTimeScale === 1 &&
    Object.keys(contracts).length === variants.length &&
    variants.every((variant) => {
      const contract = contracts[variant.id];
      return (
        contract &&
        branches.includes(contract.branch) &&
        contract.resourceType === "wood" &&
        Number.isSafeInteger(contract.minimumDelivered) &&
        contract.minimumDelivered > 0 &&
        contract.requireZeroIncomeBeforeReceipt === true &&
        Number.isSafeInteger(contract.latestTick) &&
        contract.latestTick > 0 &&
        Math.max(...(variant.checkpointTicks ?? recipe.checkpointTicks)) === contract.latestTick &&
        variant.presetWorld
      );
    }) &&
    branches.every((branch) => Object.values(contracts).some((contract) => contract.branch === branch))
  );
}

/** Validate the fixed physical trigger before browser startup; component maxima remain the native validator's job. */
export function validResourceRecoveryContract(recipe, assertion) {
  const contract = assertion.requiredResourceRecovery;
  return (
    recipe.fixedStepFrames === true &&
    recipe.simulationTimeScale === 1 &&
    contract &&
    Number.isSafeInteger(contract.latestTick) &&
    contract.latestTick > 0 &&
    Number.isSafeInteger(contract.sourceStock) &&
    contract.sourceStock > 0 &&
    contract.sourceStock <= 10 &&
    recipe.variants.every((variant) => {
      const preset = variant.presetWorld;
      const ids = new Set(preset?.actors?.map((actor) => actor.fixtureActorId));
      return (
        preset &&
        [
          contract.sourceFixtureActorId,
          contract.workerFixtureActorId,
          contract.fieldFixtureActorId,
          contract.dropOffFixtureActorId
        ].every((id) => typeof id === "string" && ids.has(id)) &&
        preset.sourceStocks?.some(
          (stock) => stock.fixtureActorId === contract.sourceFixtureActorId && stock.amount === contract.sourceStock
        ) &&
        preset.events?.some(
          (event) =>
            event.id === contract.lossEventId &&
            event.fixtureActorId === contract.dropOffFixtureActorId &&
            event.tick > 0 &&
            event.tick < contract.latestTick
        ) &&
        Math.max(...(variant.checkpointTicks ?? recipe.checkpointTicks)) === contract.latestTick
      );
    })
  );
}
