import type { nativeScenarioContext } from "../contracts/skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "../construction/evaluation/skirmish-ai-native-construction-evidence";

/** A paid wall line is complete only when every physical node in one selected graph still exists. */
export function nativeCompletedFortificationWallCount(
  context: ReturnType<typeof nativeScenarioContext>
): number | undefined {
  const protectedAsset = context.role("protected-deposit");
  const placements = new Map(nativeCompletedPlacements(context).map((placement) => [placement.siteId, placement]));
  for (const frame of context.frames) {
    for (const plan of frame.decision.missionState?.fortifications ?? []) {
      const graph = plan.graph;
      if (
        !graph ||
        plan.lifecycle !== "active" ||
        !graph.protectedAssetIds.includes(protectedAsset) ||
        new Set(graph.terrainAnchorTileKeys).size !== 2 ||
        graph.wholeConnectivity !== "preserved" ||
        graph.incrementalConnectivity !== "preserved"
      )
        continue;
      const opening = graph.nodes.find((node) => node.nodeId === graph.openingNodeId);
      if (opening?.kind !== "gate_slot" || opening.lifecycle !== "finished") continue;
      const walls = graph.nodes.filter((node) => node.kind === "wall").length;
      if (
        walls > 0 &&
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
        return walls;
    }
  }
  return undefined;
}
