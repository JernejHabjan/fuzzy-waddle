import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiFortificationNodeStateV1, AiFortificationStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogEntryV1, AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";

import { AI_FORTIFICATION_GRAPH_CAPS, tileKey, positionOf, constructionEntry } from "./ai-fortification-support";
import { fortificationPreservesConnectivityV1 } from "./ai-fortification-connectivity";
type Axis = "x" | "y";
function node(
  planId: AiFortificationStateV1["planId"],
  kind: AiFortificationNodeStateV1["kind"],
  objectName: ObjectNames | null,
  position: Vector3Simple,
  componentId: string,
  dependsOnNodeId: string | null,
  navigation: AiCapabilityCatalogEntryV1["constructionProfile"] | null,
  marginalCoverage: number,
  targetDomains: AiFortificationNodeStateV1["targetDomains"]
): AiFortificationNodeStateV1 {
  const nodeId = `${planId}:node:${kind}:${position.x}:${position.y}:${position.z}`;
  const footprintRadius = navigation?.footprintRadiusTiles ?? 0;
  const footprintTileKeys: string[] = [];
  for (let y = position.y - footprintRadius; y <= position.y + footprintRadius; y += 1) {
    for (let x = position.x - footprintRadius; x <= position.x + footprintRadius; x += 1) {
      footprintTileKeys.push(tileKey({ x, y }));
    }
  }
  return {
    nodeId,
    kind,
    objectName,
    position,
    footprintTileKeys,
    navigation: navigation
      ? {
          navigableHeight: navigation.navigableHeight,
          enterHeight: navigation.enterHeight,
          exitHeight: navigation.exitHeight
        }
      : null,
    componentId,
    dependsOnNodeId,
    lifecycle: kind === "gate_slot" && objectName === null ? "finished" : "planned",
    completedActorId: null,
    attempt: 0,
    effectId: null,
    retryAfterTick: 0,
    marginalCoverage,
    targetDomains,
    defenderPostReachable: kind === "gate_slot" || kind === "stair"
  };
}

/** Builds and checks the bounded choke layout before any resource commitment. */
export function createFortificationLayout(
  observation: AiObservationV1,
  anchor: Vector3Simple,
  target: Vector3Simple,
  planId: AiFortificationStateV1["planId"],
  wallEntry: AiCapabilityCatalogEntryV1,
  towerEntry: AiCapabilityCatalogEntryV1,
  stairEntry: AiCapabilityCatalogEntryV1,
  gateObjectName: ObjectNames | null,
  catalog: AiCapabilityCatalogV1,
  profile: AiProfileConfigV1
) {
  const byKey = new Map((observation.map?.constructionCells ?? []).map((cell) => [cell.tileKey, cell]));
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const frontAxis: Axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  const crossAxis: Axis = frontAxis === "x" ? "y" : "x";
  const direction = (frontAxis === "x" ? dx : dy) >= 0 ? 1 : -1;
  const center = {
    ...anchor,
    [frontAxis]: Math.round(anchor[frontAxis]) + 4 * direction,
    [crossAxis]: Math.round(anchor[crossAxis])
  };
  const atOffset = (offset: number, frontOffset = 0): Vector3Simple => ({
    ...center,
    [frontAxis]: center[frontAxis] + frontOffset * direction,
    [crossAxis]: center[crossAxis] + offset
  });
  const isAnchor = (offset: number) => {
    const position = atOffset(offset);
    const cell = byKey.get(tileKey(position));
    if (cell) return !cell.groundPassable || cell.waterPassable || cell.observedBlocked;
    const bounds = observation.map?.bounds;
    return (
      bounds?.status === "known" &&
      (position.x < 0 || position.y < 0 || position.x >= bounds.value.width || position.y >= bounds.value.height)
    );
  };
  let negativeAnchor: number | null = null;
  let positiveAnchor: number | null = null;
  for (let offset = 1; offset <= 8; offset += 1) {
    if (negativeAnchor === null && isAnchor(-offset)) negativeAnchor = -offset;
    if (positiveAnchor === null && isAnchor(offset)) positiveAnchor = offset;
  }
  if (negativeAnchor === null || positiveAnchor === null) return null;
  const offsets = Array.from(
    { length: positiveAnchor - negativeAnchor - 1 },
    (_, index) => negativeAnchor + index + 1
  ).filter((offset) => offset !== 0);
  if (offsets.length < 4 || offsets.length > AI_FORTIFICATION_GRAPH_CAPS.walls + AI_FORTIFICATION_GRAPH_CAPS.towers)
    return null;
  if (offsets.some((offset) => !byKey.get(tileKey(atOffset(offset)))?.groundPassable)) return null;

  const gateEntry = gateObjectName ? constructionEntry(catalog, gateObjectName) : null;
  if (gateObjectName && !gateEntry?.constructionProfile) return null;
  const gate = node(
    planId,
    "gate_slot",
    gateObjectName,
    atOffset(0),
    "opening",
    null,
    gateEntry?.constructionProfile ?? null,
    0,
    gateEntry?.targetDomains ?? []
  );
  const negativeOffsets = offsets.filter((offset) => offset < 0).reverse();
  const positiveOffsets = offsets.filter((offset) => offset > 0);
  const firstOffset = offsets[0];
  const lastOffset = offsets.at(-1);
  if (!negativeOffsets.length || !positiveOffsets.length || firstOffset === undefined || lastOffset === undefined)
    return null;
  const towerOffsets = [firstOffset, lastOffset];
  const covered = new Set<string>();
  const nodes: AiFortificationNodeStateV1[] = [gate];
  for (const side of [negativeOffsets, positiveOffsets] as const) {
    let dependency: string | null = null;
    const rootOffset = side[0];
    if (rootOffset === undefined) continue;
    const componentId = rootOffset < 0 ? "left" : "right";
    for (const offset of side) {
      const isTower = towerOffsets.includes(offset);
      const position = atOffset(offset);
      const range = towerEntry.constructionProfile?.visionRange ?? 0;
      const laneTiles = Array.from({ length: Math.max(0, Math.floor(range)) }, (_, index) =>
        tileKey(atOffset(offset, index + 1))
      );
      const marginalCoverage = isTower ? laneTiles.filter((key) => !covered.has(key)).length : 0;
      if (isTower) laneTiles.forEach((key) => covered.add(key));
      const current = node(
        planId,
        isTower ? "tower" : "wall",
        isTower ? ObjectNames.WatchTower : ObjectNames.Wall,
        position,
        componentId,
        dependency,
        (isTower ? towerEntry : wallEntry).constructionProfile ?? null,
        marginalCoverage,
        isTower ? towerEntry.targetDomains : []
      );
      nodes.push(current);
      dependency = current.nodeId;
    }
    const stairPosition = atOffset(rootOffset, -1);
    if (byKey.get(tileKey(stairPosition))?.groundPassable) {
      const rootPosition = atOffset(rootOffset);
      const rootNodeId =
        nodes.find((candidate) => candidate.position.x === rootPosition.x && candidate.position.y === rootPosition.y)
          ?.nodeId ?? null;
      nodes.push(
        node(
          planId,
          "stair",
          ObjectNames.Stairs,
          stairPosition,
          componentId,
          rootNodeId,
          stairEntry.constructionProfile ?? null,
          0,
          []
        )
      );
    }
  }
  const stairComponents = new Set(
    nodes.filter((candidate) => candidate.kind === "stair").map((candidate) => candidate.componentId)
  );
  const routedNodes = nodes.map((candidate) =>
    candidate.kind === "wall" || candidate.kind === "tower"
      ? { ...candidate, defenderPostReachable: stairComponents.has(candidate.componentId) }
      : candidate
  );
  if (
    routedNodes.length > profile.maxPlacementCandidatesPerStep ||
    routedNodes.filter((candidate) => candidate.kind === "wall").length > AI_FORTIFICATION_GRAPH_CAPS.walls ||
    routedNodes.filter((candidate) => candidate.kind === "tower").length > AI_FORTIFICATION_GRAPH_CAPS.towers ||
    routedNodes.filter((candidate) => candidate.kind === "stair").length > AI_FORTIFICATION_GRAPH_CAPS.stairs ||
    routedNodes.some((candidate) => candidate.kind !== "gate_slot" && !candidate.defenderPostReachable)
  )
    return null;
  const occupiedFootprints = new Set<string>();
  for (const candidate of routedNodes) {
    if (candidate.footprintTileKeys.some((key) => !byKey.get(key)?.groundPassable || byKey.get(key)?.observedBlocked))
      return null;
    if (candidate.footprintTileKeys.some((key) => occupiedFootprints.has(key))) return null;
    candidate.footprintTileKeys.forEach((key) => occupiedFootprints.add(key));
  }

  const shorePositions = (observation.map?.accessGraph?.transferPoints ?? [])
    .filter((point) => point.kind === "shore")
    .flatMap((point) => [point.passengerPosition, point.carrierPosition]);
  if (
    routedNodes.some(
      (candidate) =>
        candidate.kind !== "gate_slot" &&
        candidate.footprintTileKeys.some((key) => {
          const [xText = "0", yText = "0"] = key.split(",");
          const x = Number(xText);
          const y = Number(yText);
          return shorePositions.some((shore) => Math.abs(shore.x - x) + Math.abs(shore.y - y) <= 2);
        })
    )
  )
    return null;
  const blocked = routedNodes
    .filter((candidate) => candidate.kind !== "gate_slot")
    .flatMap((candidate) => candidate.footprintTileKeys);
  const requiredPositions = observation.actors
    .filter(
      (actor) => actor.relation === "self" || (actor.relation !== "enemy" && actor.resourceState.status === "known")
    )
    .map(positionOf)
    .filter((position): position is Vector3Simple => position !== null)
    .filter((position) => Math.abs(position.x - anchor.x) + Math.abs(position.y - anchor.y) <= 12);
  const protectedPosition = atOffset(0, -1);
  const exteriorPosition = atOffset(0, 1);
  if (
    !fortificationPreservesConnectivityV1({
      cells: observation.map?.constructionCells ?? [],
      blockedTileKeys: blocked,
      protectedPosition,
      openingPosition: gate.position,
      exteriorPosition,
      requiredPositions
    })
  )
    return null;

  return {
    routedNodes,
    gate,
    terrainAnchorTileKeys: [tileKey(atOffset(negativeAnchor)), tileKey(atOffset(positiveAnchor))]
  };
}
