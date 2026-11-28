import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiFortificationNodeState, AiFortificationState } from "../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog, AiCapabilityCatalogEntry } from "../../contracts/observation/ai-capability-catalog";

import type { AiObservation } from "../../contracts/observation/ai-observation";
import type { AiProfileConfig } from "../../contracts/ai-profile-config";

import {
  AI_FORTIFICATION_GRAPH_CAPS,
  type ConstructionCell,
  constructionEntry,
  positionOf,
  tileKey
} from "./ai-fortification-support";
import { fortificationPreservesConnectivity } from "./ai-fortification-connectivity";

type Axis = "x" | "y";
export type FortificationLayoutRejection =
  | "fortification_front_unobserved"
  | "fortification_terrain_choke_not_found"
  | "fortification_wall_corridor_not_viable"
  | "fortification_tower_footprint_unavailable"
  | "fortification_gate_capability_unavailable"
  | "fortification_layout_exceeds_bounded_graph"
  | "fortification_elevated_access_missing"
  | "fortification_footprint_blocked"
  | "fortification_shore_egress_conflict"
  | "fortification_route_would_be_sealed";

export interface FortificationLayout {
  routedNodes: AiFortificationNodeState[];
  gate: AiFortificationNodeState;
  terrainAnchorTileKeys: string[];
}

export type FortificationLayoutResult =
  | { layout: FortificationLayout; reason: null }
  | { layout: null; reason: FortificationLayoutRejection };

export function orderFortificationSideOffsets(
  sideNodeOffsets: readonly number[],
  accessTowerOffset: number | undefined
): number[] {
  if (accessTowerOffset === undefined) return [...sideNodeOffsets].reverse();
  return [
    accessTowerOffset,
    ...sideNodeOffsets
      .filter((offset) => offset !== accessTowerOffset)
      .sort((left, right) => Math.abs(left - accessTowerOffset) - Math.abs(right - accessTowerOffset) || left - right)
  ];
}

function node(
  planId: AiFortificationState["planId"],
  kind: AiFortificationNodeState["kind"],
  objectName: ObjectNames | null,
  position: Vector3Simple,
  componentId: string,
  dependsOnNodeId: string | null,
  navigation: AiCapabilityCatalogEntry["constructionProfile"] | null,
  marginalCoverage: number,
  targetDomains: AiFortificationNodeState["targetDomains"]
): AiFortificationNodeState {
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

function hasClearFootprint(
  position: Vector3Simple,
  footprintRadius: number,
  cells: ReadonlyMap<string, ConstructionCell>
): boolean {
  for (let y = position.y - footprintRadius; y <= position.y + footprintRadius; y += 1) {
    for (let x = position.x - footprintRadius; x <= position.x + footprintRadius; x += 1) {
      const cell = cells.get(tileKey({ x, y }));
      if (!cell?.groundPassable || cell.observedBlocked) return false;
    }
  }
  return true;
}

/** Builds and checks the bounded choke layout before any resource commitment. */
export function createFortificationLayout(
  observation: AiObservation,
  anchor: Vector3Simple,
  target: Vector3Simple,
  planId: AiFortificationState["planId"],
  wallEntry: AiCapabilityCatalogEntry,
  towerEntry: AiCapabilityCatalogEntry,
  stairEntry: AiCapabilityCatalogEntry,
  gateObjectName: ObjectNames | null,
  catalog: AiCapabilityCatalog,
  profile: AiProfileConfig
): FortificationLayoutResult {
  const byKey = new Map((observation.map?.constructionCells ?? []).map((cell) => [cell.tileKey, cell]));
  const neutralResourceKeys = new Set(
    observation.actors.flatMap((actor) => {
      const position =
        actor.relation === "neutral" && actor.resourceState.status === "known" ? positionOf(actor) : null;
      return position ? [tileKey(position)] : [];
    })
  );
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const frontAxis: Axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  const crossAxis: Axis = frontAxis === "x" ? "y" : "x";
  const direction = (frontAxis === "x" ? dx : dy) >= 0 ? 1 : -1;
  const centerAt = (frontDistance: number, crossOffset = 0) => ({
    ...anchor,
    [frontAxis]: Math.round(anchor[frontAxis]) + frontDistance * direction,
    [crossAxis]: Math.round(anchor[crossAxis]) + crossOffset
  });
  let center = centerAt(4);
  const atOffset = (offset: number, frontOffset = 0): Vector3Simple => ({
    ...center,
    [frontAxis]: center[frontAxis] + frontOffset * direction,
    [crossAxis]: center[crossAxis] + offset
  });
  const isAnchor = (offset: number) => {
    const position = atOffset(offset);
    // A harvestable neutral resource blocks its current footprint, but it is not durable terrain
    // for anchoring a defensive wall line. Placement checks still reject the occupied resource tile.
    if (neutralResourceKeys.has(tileKey(position))) return false;
    const cell = byKey.get(tileKey(position));
    // Mobile occupants make a site unavailable, but cannot provide a durable terrain anchor.
    if (cell) return !cell.groundPassable || cell.waterPassable || cell.staticBlocked === true;
    const bounds = observation.map?.bounds;
    return (
      bounds?.status === "known" &&
      (position.x < 0 || position.y < 0 || position.x >= bounds.value.width || position.y >= bounds.value.height)
    );
  };
  const requiredActors = observation.actors
    .filter(
      (actor) => actor.relation === "self" || (actor.relation !== "enemy" && actor.resourceState.status === "known")
    )
    .map((actor) => ({ actor, position: positionOf(actor) }))
    .filter(
      (entry): entry is { actor: (typeof observation.actors)[number]; position: Vector3Simple } =>
        entry.position !== null && byKey.get(tileKey(entry.position))?.groundPassable === true
    )
    .filter(({ position }) => Math.abs(position.x - anchor.x) + Math.abs(position.y - anchor.y) <= 12);
  const isStationary = (objectName: (typeof observation.actors)[number]["objectName"]) => {
    const entries = catalog.entries.filter((entry) => entry.sourceObjectName === objectName);
    return entries.length > 0 && entries.every((entry) => entry.movementDomains.length === 0);
  };
  const requiredPositions = requiredActors
    .filter(({ actor }) => !isStationary(actor.objectName))
    .map(({ position }) => position);
  const narrowRequiredPositions = requiredActors
    .filter(({ actor }) => isStationary(actor.objectName))
    .map(({ position }) => position);
  const shorePositions = (observation.map?.accessGraph?.transferPoints ?? [])
    .filter((point) => point.kind === "shore")
    .flatMap((point) => [point.passengerPosition, point.carrierPosition]);
  let negativeAnchor: number | null = null;
  let positiveAnchor: number | null = null;
  let offsets: number[] | null = null;
  let selectedTowerOffsets: number[] = [];
  let passableFrontAvailable = false;
  let wideOpeningAvailable = false;
  let terrainBoundariesAvailable = false;
  let wallCorridorAvailable = false;
  let towerFootprintAvailable = false;
  let candidateElevatedAccessAvailable = false;
  let candidateFootprintAvailable = false;
  let candidateGraphAvailable = false;
  let candidateRouteAvailable = false;
  // Relocate only a few tiles along the same front; don't replace the measured approach with a remote choke.
  const crossOffsets = [0, -1, 1, -2, 2];
  for (const frontDistance of [4, 5, 3, 6, 7, 8]) {
    for (const crossOffset of crossOffsets) {
      center = centerAt(frontDistance, crossOffset);
      const openingCell = byKey.get(tileKey(center));
      if (!openingCell?.groundPassable || openingCell.waterPassable || openingCell.observedBlocked) continue;
      passableFrontAvailable = true;
      if (
        !fortificationPreservesConnectivity({
          cells: observation.map?.constructionCells ?? [],
          blockedTileKeys: [],
          protectedPosition: atOffset(0, -1),
          openingPosition: center,
          exteriorPosition: atOffset(0, 1),
          requiredPositions: [],
          narrowRequiredPositions: [],
          exactRoutePositions: true,
          clearanceRadiusTiles: 1
        })
      )
        continue;
      wideOpeningAvailable = true;
      const negativeAnchors: number[] = [];
      const positiveAnchors: number[] = [];
      for (let offset = 1; offset <= 8; offset += 1) {
        if (isAnchor(-offset)) negativeAnchors.push(-offset);
        if (isAnchor(offset)) positiveAnchors.push(offset);
      }
      if (!negativeAnchors.length || !positiveAnchors.length) continue;
      terrainBoundariesAvailable = true;
      // Keep the full wide-unit route clear around the intentional opening. A tower footprint
      // can otherwise leave the gate tile open while narrowing the native army lane to one tile.
      const openingClearance = Math.max(
        1,
        towerEntry.constructionProfile?.footprintRadiusTiles ?? 0,
        wallEntry.constructionProfile?.footprintRadiusTiles ?? 0
      );
      const anchorPairs = negativeAnchors
        .flatMap((negative) =>
          positiveAnchors.map((positive) => {
            const candidateOffsets = Array.from(
              { length: positive - negative - 1 },
              (_, index) => negative + 1 + index
            ).filter(
              (offset) =>
                Math.abs(offset) > openingClearance + (towerEntry.constructionProfile?.footprintRadiusTiles ?? 0)
            );
            const usable =
              candidateOffsets.length >= 2 &&
              candidateOffsets.length <= AI_FORTIFICATION_GRAPH_CAPS.walls + AI_FORTIFICATION_GRAPH_CAPS.towers &&
              candidateOffsets.every((offset) => !!byKey.get(tileKey(atOffset(offset)))?.groundPassable) &&
              (candidateOffsets.some((offset) => offset < 0) || negative === -1) &&
              (candidateOffsets.some((offset) => offset > 0) || positive === 1);
            return { negative, positive, candidateOffsets, usable };
          })
        )
        .filter((pair) => pair.usable)
        .sort(
          (left, right) =>
            left.positive - left.negative - (right.positive - right.negative) ||
            Math.abs(left.negative) + left.positive - (Math.abs(right.negative) + right.positive) ||
            left.negative - right.negative ||
            left.positive - right.positive
        );
      const selectedPair = anchorPairs[0];
      if (!selectedPair) continue;
      const candidateNegative = selectedPair.negative;
      const candidatePositive = selectedPair.positive;
      const candidateOffsets = selectedPair.candidateOffsets;
      wallCorridorAvailable = true;
      if (
        !candidateOffsets.some((offset) =>
          hasClearFootprint(atOffset(offset), towerEntry.constructionProfile?.footprintRadiusTiles ?? 0, byKey)
        )
      )
        continue;
      towerFootprintAvailable = true;

      const towerFootprintRadius = towerEntry.constructionProfile?.footprintRadiusTiles ?? 0;
      const clearTowerOffsets = candidateOffsets.filter((offset) =>
        hasClearFootprint(atOffset(offset), towerFootprintRadius, byKey)
      );
      let towerPair: [number, number] | null = null;
      if (clearTowerOffsets.length >= 4) {
        for (const first of clearTowerOffsets) {
          const second = [...clearTowerOffsets]
            .reverse()
            .find((candidate) => Math.abs(candidate - first) > towerFootprintRadius * 2);
          if (second !== undefined) {
            towerPair = [first, second];
            break;
          }
        }
      }
      const singleTowerOffset = [...clearTowerOffsets].sort(
        (left, right) =>
          candidateOffsets.filter((offset) => offset !== left && Math.abs(offset - left) <= towerFootprintRadius)
            .length -
            candidateOffsets.filter((offset) => offset !== right && Math.abs(offset - right) <= towerFootprintRadius)
              .length || right - left
      )[0];
      const candidateTowerOffsets: number[] = towerPair
        ? [...towerPair]
        : singleTowerOffset === undefined
          ? []
          : [singleTowerOffset];
      const planned = [] as { kind: "stair" | "wall" | "tower"; position: Vector3Simple; radius: number }[];
      const stairFootprintRadius = stairEntry.constructionProfile?.footprintRadiusTiles ?? 0;
      let hasElevatedAccess = true;
      for (const side of [
        candidateOffsets.filter((offset) => offset < 0).reverse(),
        candidateOffsets.filter((offset) => offset > 0)
      ]) {
        const sideNodeOffsets = side.filter(
          (offset) =>
            candidateTowerOffsets.includes(offset) ||
            !candidateTowerOffsets.some((towerOffset) => Math.abs(towerOffset - offset) <= towerFootprintRadius)
        );
        const accessTowerOffset = sideNodeOffsets
          .filter((offset) => candidateTowerOffsets.includes(offset))
          .sort((left, right) => Math.abs(left) - Math.abs(right) || left - right)[0];
        const rootOffset = accessTowerOffset ?? sideNodeOffsets[0];
        if (rootOffset === undefined) continue;
        const rootFootprintRadius = candidateTowerOffsets.includes(rootOffset)
          ? towerFootprintRadius
          : (wallEntry.constructionProfile?.footprintRadiusTiles ?? 0);
        const stairPosition = atOffset(rootOffset, -(rootFootprintRadius + stairFootprintRadius + 1));
        if (!byKey.get(tileKey(stairPosition))?.groundPassable) {
          hasElevatedAccess = false;
          continue;
        }
        planned.push({ kind: "stair", position: stairPosition, radius: stairFootprintRadius });
        for (const offset of sideNodeOffsets)
          planned.push({
            kind: candidateTowerOffsets.includes(offset) ? "tower" : "wall",
            position: atOffset(offset),
            radius: candidateTowerOffsets.includes(offset)
              ? towerFootprintRadius
              : (wallEntry.constructionProfile?.footprintRadiusTiles ?? 0)
          });
      }
      if (!hasElevatedAccess) continue;
      candidateElevatedAccessAvailable = true;
      const candidateFootprints = planned.map(({ position, radius }) => {
        const keys: string[] = [];
        for (let y = position.y - radius; y <= position.y + radius; y += 1)
          for (let x = position.x - radius; x <= position.x + radius; x += 1) keys.push(tileKey({ x, y }));
        return keys;
      });
      const occupiedCandidateFootprints = new Set<string>();
      let candidateFootprintsClear = true;
      for (const footprint of candidateFootprints) {
        if (
          footprint.some((key) => !byKey.get(key)?.groundPassable || byKey.get(key)?.observedBlocked) ||
          footprint.some((key) => occupiedCandidateFootprints.has(key))
        ) {
          candidateFootprintsClear = false;
          break;
        }
        footprint.forEach((key) => occupiedCandidateFootprints.add(key));
      }
      if (!candidateFootprintsClear) continue;
      candidateFootprintAvailable = true;
      if (
        planned.length + 1 > profile.maxPlacementCandidatesPerStep ||
        planned.filter((node) => node.kind === "wall").length > AI_FORTIFICATION_GRAPH_CAPS.walls ||
        planned.filter((node) => node.kind === "tower").length > AI_FORTIFICATION_GRAPH_CAPS.towers ||
        planned.filter((node) => node.kind === "stair").length > AI_FORTIFICATION_GRAPH_CAPS.stairs
      )
        continue;
      candidateGraphAvailable = true;
      const candidateBlockedKeys = planned.flatMap(({ position, radius }) => {
        const keys: string[] = [];
        for (let y = position.y - radius; y <= position.y + radius; y += 1)
          for (let x = position.x - radius; x <= position.x + radius; x += 1) keys.push(tileKey({ x, y }));
        return keys;
      });
      const protectedPosition = atOffset(0, -1);
      const exteriorPosition = atOffset(0, 1);
      if (
        !fortificationPreservesConnectivity({
          cells: observation.map?.constructionCells ?? [],
          blockedTileKeys: candidateBlockedKeys,
          protectedPosition,
          openingPosition: center,
          exteriorPosition,
          requiredPositions,
          narrowRequiredPositions,
          exactRoutePositions: true,
          clearanceRadiusTiles: 1
        })
      ) {
        candidateRouteAvailable = true;
        continue;
      }
      negativeAnchor = candidateNegative;
      positiveAnchor = candidatePositive;
      offsets = candidateOffsets;
      selectedTowerOffsets = candidateTowerOffsets;
      break;
    }
    if (offsets !== null) break;
  }
  if (negativeAnchor === null || positiveAnchor === null || offsets === null)
    return {
      layout: null,
      reason: !passableFrontAvailable
        ? "fortification_front_unobserved"
        : !wideOpeningAvailable
          ? "fortification_route_would_be_sealed"
          : !terrainBoundariesAvailable
            ? "fortification_terrain_choke_not_found"
            : !wallCorridorAvailable
              ? "fortification_wall_corridor_not_viable"
              : !towerFootprintAvailable
                ? "fortification_tower_footprint_unavailable"
                : !candidateElevatedAccessAvailable
                  ? "fortification_elevated_access_missing"
                  : !candidateFootprintAvailable
                    ? "fortification_footprint_blocked"
                    : !candidateGraphAvailable
                      ? "fortification_layout_exceeds_bounded_graph"
                      : candidateRouteAvailable
                        ? "fortification_route_would_be_sealed"
                        : "fortification_wall_corridor_not_viable"
    };

  const gateEntry = gateObjectName ? constructionEntry(catalog, gateObjectName) : null;
  if (gateObjectName && !gateEntry?.constructionProfile)
    return { layout: null, reason: "fortification_gate_capability_unavailable" };
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
  if (
    (!negativeOffsets.length && negativeAnchor !== -1) ||
    (!positiveOffsets.length && positiveAnchor !== 1) ||
    firstOffset === undefined ||
    lastOffset === undefined
  )
    return { layout: null, reason: "fortification_wall_corridor_not_viable" };
  const towerFootprintRadius = towerEntry.constructionProfile?.footprintRadiusTiles ?? 0;
  const towerOffsets = selectedTowerOffsets;
  const covered = new Set<string>();
  const nodes: AiFortificationNodeState[] = [gate];
  for (const side of [negativeOffsets, positiveOffsets] as const) {
    const sideNodeOffsets = side.filter(
      (offset) =>
        towerOffsets.includes(offset) ||
        !towerOffsets.some((towerOffset) => Math.abs(towerOffset - offset) <= towerFootprintRadius)
    );
    const accessTowerOffset = sideNodeOffsets
      .filter((offset) => towerOffsets.includes(offset))
      .sort((left, right) => Math.abs(left) - Math.abs(right) || left - right)[0];
    const rootOffset = accessTowerOffset ?? sideNodeOffsets[0];
    if (rootOffset === undefined) continue;
    // Elevated travel starts at the stairs, so put that component's tower first and build
    // outward from it. A wall-first sequence can leave the tower beyond an unfinished gap.
    // On a wall-only component, work from the terrain anchor toward the opening so the
    // builder never has to path through a completed neighboring wall to reach its next job.
    const constructionOffsets = orderFortificationSideOffsets(sideNodeOffsets, accessTowerOffset);
    const componentId = rootOffset < 0 ? "left" : "right";
    const rootFootprintRadius = towerOffsets.includes(rootOffset)
      ? towerFootprintRadius
      : (wallEntry.constructionProfile?.footprintRadiusTiles ?? 0);
    const stairFootprintRadius = stairEntry.constructionProfile?.footprintRadiusTiles ?? 0;
    const stairFrontOffset = -(rootFootprintRadius + stairFootprintRadius + 1);
    const stairPosition = atOffset(rootOffset, stairFrontOffset);
    let accessDependency: string | null = null;
    if (byKey.get(tileKey(stairPosition))?.groundPassable) {
      const stair = node(
        planId,
        "stair",
        ObjectNames.Stairs,
        stairPosition,
        componentId,
        null,
        stairEntry.constructionProfile ?? null,
        0,
        []
      );
      nodes.push(stair);
      accessDependency = stair.nodeId;
    }
    let previousNodeId = accessDependency;
    let towerNodeId: string | null = null;
    for (const offset of constructionOffsets) {
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
        isTower ? accessDependency : (towerNodeId ?? previousNodeId),
        (isTower ? towerEntry : wallEntry).constructionProfile ?? null,
        marginalCoverage,
        isTower ? towerEntry.targetDomains : []
      );
      nodes.push(current);
      if (isTower) towerNodeId = current.nodeId;
      else if (towerNodeId === null) previousNodeId = current.nodeId;
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
    routedNodes.filter((candidate) => candidate.kind === "stair").length > AI_FORTIFICATION_GRAPH_CAPS.stairs
  )
    return { layout: null, reason: "fortification_layout_exceeds_bounded_graph" };
  if (routedNodes.some((candidate) => candidate.kind !== "gate_slot" && !candidate.defenderPostReachable))
    return { layout: null, reason: "fortification_elevated_access_missing" };
  const occupiedFootprints = new Set<string>();
  for (const candidate of routedNodes) {
    if (candidate.footprintTileKeys.some((key) => !byKey.get(key)?.groundPassable || byKey.get(key)?.observedBlocked))
      return { layout: null, reason: "fortification_footprint_blocked" };
    if (candidate.footprintTileKeys.some((key) => occupiedFootprints.has(key)))
      return { layout: null, reason: "fortification_footprint_blocked" };
    candidate.footprintTileKeys.forEach((key) => occupiedFootprints.add(key));
  }

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
    return { layout: null, reason: "fortification_shore_egress_conflict" };
  const blocked = routedNodes
    .filter((candidate) => candidate.kind !== "gate_slot")
    .flatMap((candidate) => candidate.footprintTileKeys);
  const protectedPosition = atOffset(0, -1);
  const exteriorPosition = atOffset(0, 1);
  if (
    !fortificationPreservesConnectivity({
      cells: observation.map?.constructionCells ?? [],
      blockedTileKeys: blocked,
      protectedPosition,
      openingPosition: gate.position,
      exteriorPosition,
      requiredPositions,
      narrowRequiredPositions,
      clearanceRadiusTiles: 1
    })
  )
    return { layout: null, reason: "fortification_route_would_be_sealed" };

  return {
    layout: {
      routedNodes,
      gate,
      terrainAnchorTileKeys: [tileKey(atOffset(negativeAnchor)), tileKey(atOffset(positiveAnchor))]
    },
    reason: null
  };
}
