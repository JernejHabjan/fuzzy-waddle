function same(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

/** PRO-04 pairs differ only by the useful ready copies that satisfy the control's declared force target. */
export function validProductionCompositionPair(recipe, assertion, scenarioId) {
  const requirement = assertion.requiredProductionComposition;
  if (!requirement || !Number.isSafeInteger(requirement.latestTick) || requirement.latestTick < 1 ||
      !Number.isSafeInteger(requirement.stableForTicks) || requirement.stableForTicks < 1 ||
      requirement.stableForTicks >= requirement.latestTick || !Number.isSafeInteger(requirement.targetMilitaryCount) ||
      !Number.isSafeInteger(requirement.additionalUnitCount) || requirement.additionalUnitCount < 2 ||
      requirement.targetMilitaryCount <= requirement.additionalUnitCount || !requirement.unitObjectNameByFaction) return false;
  for (const faction of assertion.requiredAiFactions) {
    const name = requirement.unitObjectNameByFaction[faction];
    if (typeof name !== "string" || name.length === 0) return false;
    const variants = recipe.variants.filter((variant) =>
      variant.aiFaction === faction && (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId)));
    const subject = variants.find((variant) => variant.productionCompositionBranch === "fill_deficit" && variant.role === "subject");
    const control = variants.find((variant) =>
      variant.productionCompositionBranch === "satisfied_control" && variant.role === "control");
    if (variants.length !== 2 || !subject || !control || !subject.pairId || subject.pairId !== control.pairId ||
        subject.seed !== control.seed || subject.humanFaction !== control.humanFaction || subject.difficulty !== control.difficulty ||
        subject.executionKind !== "focused_preset" || control.executionKind !== "focused_preset" ||
        subject.evidenceStop || control.evidenceStop ||
        !same(subject.checkpointTicks, control.checkpointTicks)) return false;
    const ticks = subject.checkpointTicks ?? recipe.checkpointTicks;
    if (ticks.at(-1) !== requirement.latestTick || !ticks.some((tick) => tick <= requirement.latestTick - requirement.stableForTicks)) {
      return false;
    }
    const left = subject.presetWorld;
    const right = control.presetWorld;
    if (!Array.isArray(left?.actors) || !Array.isArray(right?.actors) || !same(left.resourceGrants, right.resourceGrants) ||
        !same(left.resourceStarts, right.resourceStarts) || !same(left.queues, right.queues) ||
        !same(left.initialOrders, right.initialOrders) || !same(left.events, right.events) ||
        !Array.isArray(left.resourceStarts) || left.resourceStarts.length !== 1 ||
        left.resourceStarts[0]?.playerNumber !== recipe.aiPlayerNumber ||
        (left.queues?.length ?? 0) !== 0 || (left.events?.length ?? 0) !== 0) return false;
    const initialIds = new Set(left.actors.map((actor) => actor.fixtureActorId));
    if (initialIds.size !== left.actors.length ||
        new Set(right.actors.map((actor) => actor.fixtureActorId)).size !== right.actors.length ||
        left.actors.filter((actor) => actor.owner === recipe.aiPlayerNumber && actor.actorName === name).length < 2) return false;
    const extras = right.actors.filter((actor) => !initialIds.has(actor.fixtureActorId));
    if (extras.length !== requirement.additionalUnitCount ||
        extras.some((actor) => actor.actorName !== name || actor.owner !== recipe.aiPlayerNumber) ||
        !same(left.actors, right.actors.filter((actor) => initialIds.has(actor.fixtureActorId)))) return false;
  }
  return true;
}
