import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";

/** Catch stale authored roles when a focused fixture drops an actor. Runtime still checks live actors and capabilities. */
export function validateRuntimePresetRoles(world: NativeScenarioWorld | undefined, variantId: string): void {
  if (!world) return;
  const declared = [
    ...(world.actors ?? []),
    ...(world.existingActorBindings ?? []),
    ...(world.constructionOrders ?? [])
  ].map((actor) => actor.fixtureActorId);
  const roles = new Set(declared);
  if (roles.size !== declared.length) throw new Error("runtime_recipe_duplicate_actor_role:" + variantId);

  const references = {
    initialOrders: world.initialOrders?.flatMap((order) => [order.workerFixtureActorId, order.sourceFixtureActorId]),
    queues: world.queues?.map((queue) => queue.producerFixtureActorId),
    researchQueues: world.researchQueues?.map((queue) => queue.producerFixtureActorId),
    sourceStocks: world.sourceStocks?.map((stock) => stock.fixtureActorId),
    healthStarts: world.healthStarts?.map((start) => start.fixtureActorId),
    constructionOrders: world.constructionOrders?.flatMap((order) => order.builderFixtureActorIds),
    productionRallies: world.productionRallies?.map((rally) => rally.targetFixtureActorId),
    controls: world.controls?.flatMap((control) => [
      control.producerFixtureActorId,
      ...(control.action.targetFixtureActorId === undefined ? [] : [control.action.targetFixtureActorId])
    ]),
    events: world.events?.flatMap((event) => (event.fixtureActorId === undefined ? [] : [event.fixtureActorId])),
    routeOutages: world.routeOutages?.flatMap((outage) => outage.fixtureActorIds)
  };
  for (const [channel, identities] of Object.entries(references)) {
    for (const identity of identities ?? [])
      if (typeof identity !== "string" || !roles.has(identity))
        throw new Error("runtime_recipe_unknown_actor_role:" + variantId + ":" + channel + ":" + identity);
  }
}
