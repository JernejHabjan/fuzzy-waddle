import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

/** New AI construction requires its exact shared outcome, native charge and native completion, not a seeded prefab. */
export function nativeCompletedPlacements(context: ReturnType<typeof nativeScenarioContext>, requireRetained = true) {
  return context.facts.flatMap((fact) => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "placement") return [];
    const value = fact.spatial, siteId = value.site.actorId, execution = value.command.execution;
    if (value.command.playerNumber !== 2 || execution?.source !== "ai" || !siteId || !value.legal ||
        !value.sceneActive || value.snapshotRestoreInProgress || value.clockTick !== fact.tick ||
        value.gaps.length || !value.footprint?.length || Object.values(context.roles).includes(siteId)) return [];
    const selected = context.frames.find((frame) => frame.sequence < fact.sequence && frame.decision.acceptedIntents.some((intent) =>
      intent.kind === "construct" && intent.effectId === execution.effectId && intent.objectName === value.command.actorName));
    const applied = context.facts.filter((entry) => entry.kind === "outcome" && entry.outcome.kind === "applied" &&
      entry.outcome.commandId === execution.commandId && entry.outcome.worldLinkIds.length === 1 &&
      entry.outcome.worldLinkIds[0] === siteId);
    const charges = context.facts.filter((entry) => entry.kind === "construction_authority" &&
      entry.construction.kind === "resource" && entry.construction.operation === "start_charge" &&
      entry.construction.site.actorId === siteId && entry.construction.status === "returned" &&
      entry.construction.ownerArgument === 2 && entry.construction.callbackCount === 1 && entry.construction.balanceMatches &&
      !entry.construction.nestedEmission && entry.construction.sceneActive && !entry.construction.snapshotRestoreInProgress);
    const finished = context.facts.filter((entry) => entry.kind === "construction_authority" &&
      entry.construction.kind === "lifecycle" && entry.construction.transition === "finished" &&
      entry.construction.site.actorId === siteId && entry.construction.sceneActive &&
      !entry.construction.snapshotRestoreInProgress && entry.construction.clockTick === entry.tick);
    const completion = finished[0];
    if (!selected || applied.length !== 1 || charges.length !== 1 || finished.length !== 1 || !completion ||
        requireRetained && !context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) => identity.actorId === siteId &&
          identity.alive && identity.active && identity.indexed && identity.finished)) return [];
    return [{ fact, value, siteId, selected, completionTick: completion.tick, charge: charges[0] }];
  });
}

/** Count native legal, unoccupied, unreserved field footprints across the entire setup map, using its actual field shape. */
export function nativeInitialFieldSites(context: ReturnType<typeof nativeScenarioContext>) {
  const setup = context.capture?.setup, baseline = context.result.productionPreset?.placementBaseline;
  const field = nativeCompletedPlacements(context).find((placement) => placement.value.site.canonicalObjectName === "Field");
  const layer = setup?.topology[0];
  if (!setup || !layer || !baseline || !field || setup.actors.some((actor) => !actor.footprint)) return null;
  const footprint = field.value.footprint;
  if (!footprint) return null;
  const offsets = footprint.map((tile) => ({ x: tile.x - field.value.command.tileVec3.x, y: tile.y - field.value.command.tileVec3.y }));
  const occupied = new Set(setup.actors.flatMap((actor) => actor.footprint?.map((tile) => `${tile.x},${tile.y}`) ?? []));
  const reserved = new Set(baseline.routes.flatMap((route) => (route.path ?? []).flatMap((tile) => {
    const margin = route.declaration.tileMargin, cells: string[] = [];
    for (let dx = -margin; dx <= margin; dx++) for (let dy = -margin; dy <= margin; dy++) cells.push(`${tile.x + dx},${tile.y + dy}`);
    return cells;
  })));
  const available = new Set(layer.cells.flatMap((cell, ordinal) => !cell.collides &&
    !!cell.properties && typeof cell.properties === "object" && !Array.isArray(cell.properties) &&
    !("navigationRestriction" in cell.properties && cell.properties.navigationRestriction) &&
    !("terrainType" in cell.properties && cell.properties.terrainType === "water")
      ? [`${ordinal % layer.width},${Math.floor(ordinal / layer.width)}`] : []));
  const sites: { x: number; y: number }[] = [];
  for (let y = 0; y < layer.height; y++) for (let x = 0; x < layer.width; x++) {
    if (offsets.every((offset) => {
      const key = `${x + offset.x},${y + offset.y}`;
      return available.has(key) && !occupied.has(key) && !reserved.has(key);
    })) sites.push({ x, y });
  }
  return sites;
}
