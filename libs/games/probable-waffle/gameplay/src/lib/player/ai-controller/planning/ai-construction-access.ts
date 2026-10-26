import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";

/**
 * Checks footprints against the bounded observed ground component. Current bodies forbid placement, not travel.
 * Every prefix keeps the builder connected to the remaining known space, including resource and spawn approaches.
 * Missing advisory origin cells defer to native placement; a known disconnected site is never proposed.
 */
export function constructionAccessPolicy(
  observation: AiObservationV1,
  builder: AiObservedActorV1,
  reserved: ReadonlySet<string>
): (footprint: readonly string[]) => boolean {
  const cells = new Map((observation.map?.constructionCells ?? []).map((cell) => [cell.tileKey, cell]));
  if (builder.logicalPosition.status !== "known") return () => false;
  const origin = builder.logicalPosition.value;
  const start = `${Math.round(origin.x)},${Math.round(origin.y)}`;
  const flood = (blocked: ReadonlySet<string>): Set<string> => {
    const reached = new Set<string>();
    const first = cells.get(start);
    if (!first?.groundPassable || blocked.has(start)) return reached;
    const pending = [first];
    reached.add(start);
    for (let cursor = 0; cursor < pending.length; cursor += 1) {
      const cell = pending[cursor];
      if (!cell) continue;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ] as const) {
        const next = cells.get(`${cell.position.x + dx},${cell.position.y + dy}`);
        if (
          !next?.groundPassable ||
          next.elevation !== cell.elevation ||
          blocked.has(next.tileKey) ||
          reached.has(next.tileKey)
        )
          continue;
        reached.add(next.tileKey);
        pending.push(next);
      }
    }
    return reached;
  };
  const before = flood(new Set());
  if (before.size === 0) return () => true;
  const shoreKeys = new Set(
    (observation.map?.accessGraph?.transferPoints ?? [])
      .filter((point) => point.kind === "shore")
      .flatMap((point) => [point.passengerPosition, point.carrierPosition])
      .map((position) => `${Math.round(position.x)},${Math.round(position.y)}`)
  );
  const actorsById = new Map(observation.actors.map((actor) => [actor.actorId, actor]));
  const orderEndpointKeys = new Set<string>();
  const workerClearanceKeys = new Set<string>();
  for (const actor of observation.actors) {
    if (actor.visibility !== "owned") continue;
    if (actor.actorId !== builder.actorId && actor.logicalPosition.status === "known" &&
        actor.capabilities.some((capability) => capability.family === "build" || capability.family === "gather")) {
      const position = actor.logicalPosition.value;
      const x = Math.round(position.x), y = Math.round(position.y);
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1)
        workerClearanceKeys.add(`${x + dx},${y + dy}`);
    }
    for (const orderValue of [actor.activeOrder, actor.pendingOrder]) {
      if (orderValue?.status !== "known" || !orderValue.value) continue;
      const order = orderValue.value;
      if (!["Move", "Gather", "ReturnResources"].includes(order.orderType)) continue;
      const target = order.targetPosition
        ? order.targetPosition
        : order.targetActorId
          ? actorsById.get(order.targetActorId)?.logicalPosition
          : undefined;
      if (target && "status" in target) {
        if (target.status === "known")
          orderEndpointKeys.add(`${Math.round(target.value.x)},${Math.round(target.value.y)}`);
      } else if (target) orderEndpointKeys.add(`${Math.round(target.x)},${Math.round(target.y)}`);
    }
  }
  return (footprint) => {
    if (
      !footprint.some((key) => before.has(key)) ||
      footprint.some((key) => shoreKeys.has(key) || orderEndpointKeys.has(key) || workerClearanceKeys.has(key))
    )
      return false;
    const blocked = new Set([...reserved, ...footprint]);
    if (blocked.has(start)) return false;
    const after = flood(blocked);
    for (const key of before) if (!blocked.has(key) && !after.has(key)) return false;
    return after.size > 0;
  };
}
