function same(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function validPair(pair, requirement, recipe, faction, scenarioId) {
  if (pair.length !== 2) return false;
  const subject = pair.find((variant) => variant.role === "subject" &&
    variant.productionCompositionBranch === "fill_deficit");
  const control = pair.find((variant) => variant.role === "control" &&
    ["satisfied_control", "seeded_queue_control"].includes(variant.productionCompositionBranch));
  if (!subject || !control || subject.pairId !== control.pairId || subject.seed !== control.seed ||
      subject.humanFaction !== control.humanFaction || subject.difficulty !== control.difficulty ||
      subject.executionKind !== "focused_preset" || control.executionKind !== "focused_preset" ||
      subject.evidenceStop || control.evidenceStop || !same(subject.checkpointTicks, control.checkpointTicks)) return false;
  const ticks = subject.checkpointTicks ?? recipe.checkpointTicks;
  if (ticks.at(-1) !== requirement.latestTick ||
      !ticks.some((tick) => tick <= requirement.latestTick - requirement.stableForTicks)) return false;
  const left = subject.presetWorld;
  const right = control.presetWorld;
  if (!Array.isArray(left?.actors) || !Array.isArray(right?.actors) || !same(left.resourceGrants, right.resourceGrants) ||
      !same(left.resourceStarts, right.resourceStarts) || !Array.isArray(left.resourceStarts) ||
      left.resourceStarts.length !== 1 || left.resourceStarts[0]?.playerNumber !== recipe.aiPlayerNumber ||
      !same(left.initialOrders, right.initialOrders) || !same(left.events, right.events) ||
      (left.events?.length ?? 0) !== 0) return false;
  const leftIds = new Set(left.actors.map((actor) => actor.fixtureActorId));
  const rightIds = new Set(right.actors.map((actor) => actor.fixtureActorId));
  if (leftIds.size !== left.actors.length || rightIds.size !== right.actors.length) return false;
  const queueControl = control.productionCompositionBranch === "seeded_queue_control";
  if (!same(left.actors, right.actors.filter((actor) => leftIds.has(actor.fixtureActorId))) ||
      left.actors.some((actor) => !rightIds.has(actor.fixtureActorId)) ||
      (left.queues?.length ?? 0) !== 0) return false;
  const queueItems = right.queues ?? [];
  if (queueControl) {
    const producerName = faction === "Tivara" ? "AnkGuard" : "InfantryInn";
    if (queueItems.reduce((sum, queue) => sum + queue.count, 0) !== requirement.additionalUnitCount ||
        queueItems.length !== requirement.additionalUnitCount ||
        new Set(queueItems.map((queue) => queue.producerFixtureActorId)).size !== queueItems.length ||
        queueItems.some((queue) => queue.actorName !== requirement.unitObjectNameByFaction[faction] ||
          !rightIds.has(queue.producerFixtureActorId) ||
          right.actors.find((actor) => actor.fixtureActorId === queue.producerFixtureActorId)?.actorName !== producerName ||
          right.actors.find((actor) => actor.fixtureActorId === queue.producerFixtureActorId)?.owner !==
            recipe.aiPlayerNumber)) return false;
  } else {
    if ((right.queues?.length ?? 0) !== 0 || (right.events?.length ?? 0) !== 0) return false;
    const extras = right.actors.filter((actor) => !leftIds.has(actor.fixtureActorId));
    if (extras.length !== requirement.additionalUnitCount ||
        extras.some((actor) => actor.actorName !== requirement.unitObjectNameByFaction[faction] ||
          actor.owner !== recipe.aiPlayerNumber)) return false;
  }
  const unitName = requirement.unitObjectNameByFaction[faction];
  const militaryNames = faction === "Tivara"
    ? ["TivaraMacemanMale", "TivaraSlingshotFemale"]
    : ["SkaduweeWarriorMale", "SkaduweeRangedFemale"];
  const initialUnitCount = left.actors.filter((actor) => actor.owner === recipe.aiPlayerNumber &&
    militaryNames.includes(actor.actorName)).length;
  const expectedReadyCount = requirement.targetMilitaryCount - requirement.additionalUnitCount;
  return initialUnitCount === expectedReadyCount && scenarioId === "PRO-04";
}

/** Both PRO-04 pairs must isolate their own causal variable for each required faction. */
export function validProductionCompositionPair(recipe, assertion, scenarioId) {
  const requirement = assertion.requiredProductionComposition;
  if (!requirement || !Number.isSafeInteger(requirement.latestTick) || requirement.latestTick < 1 ||
      !Number.isSafeInteger(requirement.stableForTicks) || requirement.stableForTicks < 1 ||
      requirement.stableForTicks >= requirement.latestTick || !Number.isSafeInteger(requirement.targetMilitaryCount) ||
      !Number.isSafeInteger(requirement.additionalUnitCount) || requirement.additionalUnitCount < 2 ||
      requirement.targetMilitaryCount <= requirement.additionalUnitCount || !requirement.unitObjectNameByFaction) return false;
  for (const faction of assertion.requiredAiFactions) {
    if (!requirement.unitObjectNameByFaction[faction]) return false;
    const variants = recipe.variants.filter((variant) => variant.aiFaction === faction &&
      (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId)));
    if (variants.length !== 4) return false;
    const pairs = new Map();
    for (const variant of variants) {
      if (!variant.pairId) return false;
      const members = pairs.get(variant.pairId) ?? [];
      members.push(variant);
      pairs.set(variant.pairId, members);
    }
    if (pairs.size !== 2) return false;
    const controls = new Set();
    for (const pair of pairs.values()) {
      if (!validPair(pair, requirement, recipe, faction, scenarioId)) return false;
      controls.add(pair.find((variant) => variant.role === "control")?.productionCompositionBranch);
    }
    if (!controls.has("satisfied_control") || !controls.has("seeded_queue_control")) return false;
  }
  return true;
}
