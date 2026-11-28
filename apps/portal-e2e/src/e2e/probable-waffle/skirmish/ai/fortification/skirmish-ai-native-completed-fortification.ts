import type { nativeScenarioContext } from "../contracts/skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "../construction/evaluation/skirmish-ai-native-construction-evidence";
import type { RuntimePresetWorld } from "../setup/skirmish-ai-runtime-preset-world";

/** A paid wall line is complete only when every physical node in one selected graph still exists. */
export function nativeCompletedFortification(
  context: ReturnType<typeof nativeScenarioContext>,
  preset: RuntimePresetWorld
) {
  const protectedAsset = context.role("protected-deposit");
  const anchors = (preset.terrainPatches ?? []).filter((patch) => patch.blocked);
  const topology = context.capture?.setup?.topology ?? [];
  const terrainAnchors = preset.fixtureId.endsWith("-terrain");
  const hasNativeAnchor = (key: string): boolean => {
    const [xText = "", yText = ""] = key.split(",");
    const x = Number(xText),
      y = Number(yText);
    if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (
      topology.some((layer) => {
        if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return false;
        const properties = layer.cells[y * layer.width + x]?.properties;
        return (
          !!properties &&
          typeof properties === "object" &&
          "navigationRestriction" in properties &&
          properties.navigationRestriction === true
        );
      })
    )
      return true;
    if (terrainAnchors) return false;
    return (context.capture?.setup?.actors ?? []).some(
      (actor) =>
        !("blackboard" in actor.definition) && (actor.footprint?.some((tile) => tile.x === x && tile.y === y) ?? false)
    );
  };
  if (
    anchors.length !== 2 ||
    !anchors.every(({ x, y }) =>
      topology.some((layer) => {
        if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return false;
        const properties = layer.cells[y * layer.width + x]?.properties;
        return (
          !!properties &&
          typeof properties === "object" &&
          "navigationRestriction" in properties &&
          properties.navigationRestriction === true
        );
      })
    )
  )
    return undefined;
  const placements = new Map(nativeCompletedPlacements(context).map((placement) => [placement.siteId, placement]));
  for (const frame of context.frames) {
    for (const plan of frame.decision.missionState?.fortifications ?? []) {
      const graph = plan.graph;
      if (
        !graph ||
        plan.lifecycle !== "active" ||
        !graph.protectedAssetIds.includes(protectedAsset) ||
        new Set(graph.terrainAnchorTileKeys).size !== 2 ||
        !graph.terrainAnchorTileKeys.every(hasNativeAnchor) ||
        (terrainAnchors && !anchors.every(({ x, y }) => graph.terrainAnchorTileKeys.includes(`${x},${y}`))) ||
        graph.wholeConnectivity !== "preserved" ||
        graph.incrementalConnectivity !== "preserved"
      )
        continue;
      const opening = graph.nodes.find((node) => node.nodeId === graph.openingNodeId);
      if (opening?.kind !== "gate_slot" || opening.lifecycle !== "finished") continue;
      const walls = graph.nodes.filter((node) => node.kind === "wall").length;
      const towerIds = new Set(
        graph.nodes.flatMap((node) => (node.kind === "tower" && node.completedActorId ? [node.completedActorId] : []))
      );
      if (
        walls > 0 &&
        towerIds.size > 0 &&
        graph.nodes.every((node) => {
          if (node === opening && node.objectName === null) return true;
          const placement = node.completedActorId ? placements.get(node.completedActorId) : undefined;
          const position = placement?.value.command.tileVec3;
          return (
            node.lifecycle === "finished" &&
            !!placement &&
            placement.completionTick <= frame.tick &&
            placement.value.site.canonicalObjectName === node.objectName &&
            position?.x === node.position.x &&
            position.y === node.position.y &&
            position.z === node.position.z
          );
        })
      )
        return { walls, readyTick: frame.tick, towerIds, opening: opening.position };
    }
  }
  return undefined;
}
