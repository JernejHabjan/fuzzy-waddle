function same(valueA, valueB) {
  return JSON.stringify(valueA ?? null) === JSON.stringify(valueB ?? null);
}

function covers(variant, scenarioId) {
  return variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId);
}

/** A capacity pair may differ only by the extra ready producer in its control world. */
export function validProductionCapacityPair(recipe, assertion, scenarioId) {
  const requirement = assertion.requiredProductionCapacity;
  const names = requirement?.producerObjectNameByFaction;
  if (!names || !Number.isSafeInteger(requirement.latestTick) || requirement.latestTick < 1 ||
      requirement.latestTick > Math.max(...recipe.checkpointTicks)) return false;
  for (const faction of assertion.requiredAiFactions) {
    const producer = names[faction];
    if (typeof producer !== "string" || producer.length === 0) return false;
    const variants = recipe.variants.filter((variant) => variant.aiFaction === faction && covers(variant, scenarioId));
    const subject = variants.find((variant) => variant.productionCapacityBranch === "build" && variant.role === "subject");
    const control = variants.find((variant) =>
      variant.productionCapacityBranch === "already_sufficient" && variant.role === "control");
    if (variants.length !== 2 || !subject || !control || !subject.pairId || subject.pairId !== control.pairId ||
        subject.seed !== control.seed || subject.executionKind !== "focused_preset" ||
        control.executionKind !== "focused_preset" || subject.humanFaction !== control.humanFaction ||
        subject.difficulty !== control.difficulty) return false;
    const left = subject.presetWorld;
    const right = control.presetWorld;
    if (!left || !right || !same(left.resourceGrants, right.resourceGrants) ||
        !same(left.resourceStarts, right.resourceStarts) || !same(left.queues, right.queues) ||
        !same(left.researchQueues, right.researchQueues) || !same(left.initialOrders, right.initialOrders) ||
        !same(left.events, right.events)) return false;
    const initial = left.actors.filter((actor) => actor.owner === recipe.aiPlayerNumber && actor.actorName === producer);
    const ample = right.actors.filter((actor) => actor.owner === recipe.aiPlayerNumber && actor.actorName === producer);
    if (initial.length !== 1 || ample.length !== 2) return false;
    const shared = right.actors.filter((actor) => !ample.some((candidate) =>
      candidate.fixtureActorId === actor.fixtureActorId && !initial.some((base) => base.fixtureActorId === actor.fixtureActorId)));
    if (!same(left.actors, shared)) return false;
  }
  return true;
}
