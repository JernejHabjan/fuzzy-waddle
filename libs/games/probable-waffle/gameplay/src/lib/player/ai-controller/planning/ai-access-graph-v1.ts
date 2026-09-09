import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type {
  AiAccessGraphV1,
  AiAccessLinkV1,
  AiAccessRegionV1,
  AiAccessTransferPointV1,
  AiRouteRequestV1,
  AiRouteResultV1
} from "../contracts/ai-access-graph-v1";
import type { AiAccessNodeId } from "../contracts/ai-core-types";

/** One tile sampled from runtime movement authorities before pure region construction. */
export interface AiAccessCellV1 {
  readonly x: number;
  readonly y: number;
  readonly ground: boolean;
  readonly water: boolean;
  readonly elevation: number;
  readonly groundNeighborKeys: readonly string[];
  readonly knowledge: "known_static" | "observed_dynamic" | "unknown";
  /** Ground footprint clearance; retained as the default for authored V1 fixtures. */
  readonly clearance: number;
  /** Water-carrier footprint clearance when this tile belongs to a water region. */
  readonly waterClearance?: number;
}

/** Immutable inputs for one cached topology generation. */
export interface BuildAiAccessGraphV1Input {
  readonly generation: number;
  readonly staticRevision: number;
  readonly dynamicRevision: number;
  readonly threatRevision: number;
  readonly builtTick: number;
  readonly continuationCursor: number;
  readonly includeAirRegion: boolean;
  readonly cells: readonly AiAccessCellV1[];
}

/** Result includes a runtime-only lookup used to assign actors to stable region IDs. */
export interface BuiltAiAccessGraphV1 {
  readonly graph: AiAccessGraphV1;
  readonly groundNodeByTileKey: ReadonlyMap<string, AiAccessNodeId>;
  readonly waterNodeByTileKey: ReadonlyMap<string, AiAccessNodeId>;
  readonly airNodeId: AiAccessNodeId | null;
}

const keyOf = (x: number, y: number) => `${x},${y}`;
const positionOf = (cell: AiAccessCellV1): Vector3Simple => ({ x: cell.x, y: cell.y, z: cell.elevation });

function compareCells(left: AiAccessCellV1, right: AiAccessCellV1): number {
  return left.y - right.y || left.x - right.x || left.elevation - right.elevation;
}

function clearanceFor(cell: AiAccessCellV1, domain: "ground" | "water"): number {
  return domain === "water" ? (cell.waterClearance ?? cell.clearance) : cell.clearance;
}

function buildRegions(
  domain: "ground" | "water",
  cells: readonly AiAccessCellV1[],
  lookup: Map<string, AiAccessNodeId>
): AiAccessRegionV1[] {
  const eligible = new Map(
    cells
      .filter((cell) => (domain === "ground" ? cell.ground : cell.water))
      .sort(compareCells)
      .map((cell) => [keyOf(cell.x, cell.y), cell] as const)
  );
  const visited = new Set<string>();
  const regions: AiAccessRegionV1[] = [];
  for (const [startKey] of eligible) {
    if (visited.has(startKey)) continue;
    const queue = [startKey];
    let queueCursor = 0;
    const members: AiAccessCellV1[] = [];
    visited.add(startKey);
    while (queueCursor < queue.length) {
      const currentKey = queue[queueCursor];
      queueCursor += 1;
      if (!currentKey) continue;
      const current = eligible.get(currentKey);
      if (!current) continue;
      members.push(current);
      const neighbors =
        domain === "ground"
          ? current.groundNeighborKeys
          : [
              keyOf(current.x, current.y - 1),
              keyOf(current.x - 1, current.y),
              keyOf(current.x + 1, current.y),
              keyOf(current.x, current.y + 1)
            ];
      for (const neighborKey of [...neighbors].sort()) {
        const neighbor = eligible.get(neighborKey);
        if (
          visited.has(neighborKey) ||
          !neighbor ||
          clearanceFor(neighbor, domain) !== clearanceFor(current, domain) ||
          neighbor.elevation !== current.elevation
        )
          continue;
        visited.add(neighborKey);
        queue.push(neighborKey);
      }
    }
    members.sort(compareCells);
    const representative = members[0]!;
    const nodeId =
      `access:region:${domain}:${representative.x}:${representative.y}:${representative.elevation}` as const;
    for (const member of members) lookup.set(keyOf(member.x, member.y), nodeId);
    regions.push({
      nodeId,
      domain,
      elevation: representative.elevation,
      knowledge: members.some((member) => member.knowledge === "unknown")
        ? "unknown"
        : members.some((member) => member.knowledge === "observed_dynamic")
          ? "observed_dynamic"
          : "known_static",
      representativePosition: positionOf(representative),
      tileCount: members.length,
      clearance: clearanceFor(representative, domain)
    });
  }
  return regions.sort((left, right) => left.nodeId.localeCompare(right.nodeId));
}

/** Builds stable components and shore transfers independent of input enumeration order. */
export function buildAiAccessGraphV1(input: BuildAiAccessGraphV1Input): BuiltAiAccessGraphV1 {
  const cells = [...input.cells].sort(compareCells);
  const cellByKey = new Map(cells.map((cell) => [keyOf(cell.x, cell.y), cell] as const));
  const groundNodeByTileKey = new Map<string, AiAccessNodeId>();
  const waterNodeByTileKey = new Map<string, AiAccessNodeId>();
  const nodes = [
    ...buildRegions("ground", cells, groundNodeByTileKey),
    ...buildRegions("water", cells, waterNodeByTileKey)
  ];
  const links = new Map<string, AiAccessLinkV1>();
  for (const domain of ["ground", "water"] as const) {
    const lookup = domain === "ground" ? groundNodeByTileKey : waterNodeByTileKey;
    for (const cell of cells.filter((candidate) => (domain === "ground" ? candidate.ground : candidate.water))) {
      const fromNodeId = lookup.get(keyOf(cell.x, cell.y));
      if (!fromNodeId) continue;
      const neighborKeys =
        domain === "ground" ? cell.groundNeighborKeys : [keyOf(cell.x + 1, cell.y), keyOf(cell.x, cell.y + 1)];
      for (const neighborKey of neighborKeys) {
        const toNodeId = lookup.get(neighborKey);
        if (!toNodeId || toNodeId === fromNodeId) continue;
        const left = fromNodeId.localeCompare(toNodeId) <= 0 ? fromNodeId : toNodeId;
        const right = left === fromNodeId ? toNodeId : fromNodeId;
        const linkId = `access:link:${domain}:${left}:${right}`;
        const neighbor = cellByKey.get(neighborKey);
        const clearance = Math.min(clearanceFor(cell, domain), neighbor ? clearanceFor(neighbor, domain) : 1);
        const knowledge =
          cell.knowledge === "unknown" || neighbor?.knowledge === "unknown"
            ? "unknown"
            : cell.knowledge === "observed_dynamic" || neighbor?.knowledge === "observed_dynamic"
              ? "observed_dynamic"
              : "known_static";
        const existing = links.get(linkId);
        if (!existing || clearance > existing.clearance) {
          links.set(linkId, {
            linkId,
            fromNodeId: left,
            toNodeId: right,
            domain,
            clearance,
            distanceCost: 1,
            knowledge
          });
        }
      }
    }
  }
  const airNodeId = input.includeAirRegion ? ("access:region:air:global" as const) : null;
  if (airNodeId) {
    nodes.push({
      nodeId: airNodeId,
      domain: "air",
      elevation: 0,
      knowledge: "known_static",
      representativePosition: cells[0] ? positionOf(cells[0]) : { x: 0, y: 0, z: 0 },
      tileCount: cells.length,
      clearance: Number.MAX_SAFE_INTEGER
    });
  }
  const transfers = new Map<string, AiAccessTransferPointV1>();
  for (const ground of cells.filter((cell) => cell.ground)) {
    const groundNodeId = groundNodeByTileKey.get(keyOf(ground.x, ground.y));
    if (!groundNodeId) continue;
    const adjacentWater = [
      { x: ground.x, y: ground.y - 1 },
      { x: ground.x - 1, y: ground.y },
      { x: ground.x + 1, y: ground.y },
      { x: ground.x, y: ground.y + 1 }
    ].sort((left, right) => left.y - right.y || left.x - right.x);
    for (const water of adjacentWater) {
      const waterNodeId = waterNodeByTileKey.get(keyOf(water.x, water.y));
      if (!waterNodeId) continue;
      const transferId = `transfer:shore:${ground.x}:${ground.y}:${water.x}:${water.y}`;
      transfers.set(transferId, {
        transferId,
        kind: "shore",
        fromNodeId: groundNodeId,
        toNodeId: waterNodeId,
        passengerPosition: { x: ground.x, y: ground.y, z: ground.elevation },
        carrierPosition: { x: water.x, y: water.y, z: 0 },
        clearance: Math.max(1, ground.clearance),
        knowledge: ground.knowledge
      });
    }
  }
  const unknownNodeIds = nodes
    .filter((node) => node.knowledge === "unknown")
    .map((node) => node.nodeId)
    .sort();
  return {
    graph: {
      schemaVersion: 1,
      generation: input.generation,
      status: "ready",
      staticRevision: input.staticRevision,
      dynamicRevision: input.dynamicRevision,
      threatRevision: input.threatRevision,
      builtTick: input.builtTick,
      continuationCursor: input.continuationCursor,
      nodes: nodes.sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
      links: [...links.values()].sort((left, right) => left.linkId.localeCompare(right.linkId)),
      transferPoints: [...transfers.values()].sort((left, right) => left.transferId.localeCompare(right.transferId)),
      unknownNodeIds
    },
    groundNodeByTileKey,
    waterNodeByTileKey,
    airNodeId
  };
}

function routeDistance(left: AiAccessRegionV1, right: AiAccessRegionV1): number {
  return Math.floor(
    Math.abs(left.representativePosition.x - right.representativePosition.x) +
      Math.abs(left.representativePosition.y - right.representativePosition.y) +
      Math.abs(left.representativePosition.z - right.representativePosition.z)
  );
}

function findDomainRoute(
  graph: AiAccessGraphV1,
  source: AiAccessRegionV1,
  destination: AiAccessRegionV1,
  requiredClearance: number,
  allowUnknown = false
): readonly AiAccessNodeId[] | undefined {
  if (source.domain !== destination.domain) return undefined;
  if (source.clearance < requiredClearance || destination.clearance < requiredClearance) return undefined;
  if (source.nodeId === destination.nodeId) return [source.nodeId];
  const queue: AiAccessNodeId[][] = [[source.nodeId]];
  let queueCursor = 0;
  const visited = new Set<AiAccessNodeId>([source.nodeId]);
  while (queueCursor < queue.length) {
    const path = queue[queueCursor];
    queueCursor += 1;
    if (!path) break;
    const current = path[path.length - 1];
    if (!current) continue;
    const neighbors = graph.links
      .filter(
        (link) =>
          link.domain === source.domain &&
          (allowUnknown || link.knowledge !== "unknown") &&
          link.clearance >= requiredClearance &&
          (link.fromNodeId === current || link.toNodeId === current)
      )
      .map((link) => (link.fromNodeId === current ? link.toNodeId : link.fromNodeId))
      .sort();
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const next = [...path, neighbor];
      if (neighbor === destination.nodeId) return next;
      visited.add(neighbor);
      queue.push(next);
    }
  }
  return undefined;
}

/** Selects a typed feasible route without consulting mutable runtime state. */
export function queryAiAccessRouteV1(graph: AiAccessGraphV1, request: AiRouteRequestV1): AiRouteResultV1 {
  const base = {
    queryId: request.queryId,
    graphGeneration: graph.generation,
    sourceNodeId: request.fromNodeId,
    destinationNodeId: request.toNodeId,
    distanceCost: 0,
    riskCost: 0
  };
  if (graph.status === "service_failed") {
    return { ...base, kind: "impossible", reason: "service_failed", requiredAssets: [] };
  }
  if (graph.status !== "ready") {
    return { ...base, kind: "pending", reason: "graph_pending", requiredAssets: [] };
  }
  const source = graph.nodes.find((node) => node.nodeId === request.fromNodeId);
  const requestedDestinations =
    request.kind === "firing_position" && request.firingNodeIds.length
      ? [...request.firingNodeIds].sort()
      : [request.toNodeId];
  const destination = requestedDestinations
    .map((nodeId) => graph.nodes.find((node) => node.nodeId === nodeId))
    .find(Boolean);
  if (!source) return { ...base, kind: "impossible", reason: "missing_source_region", requiredAssets: [] };
  if (!destination) return { ...base, kind: "impossible", reason: "missing_destination_region", requiredAssets: [] };
  const measuredBase = {
    ...base,
    destinationNodeId: destination.nodeId,
    distanceCost: routeDistance(source, destination)
  };
  if (source.knowledge === "unknown" || destination.knowledge === "unknown") {
    return { ...measuredBase, kind: "pending", reason: "unknown_region", requiredAssets: [] };
  }
  const directDomain = request.capabilities.moverDomains.find(
    (domain) => domain === source.domain && domain === destination.domain
  );
  if (directDomain) {
    const routeNodeIds = findDomainRoute(graph, source, destination, request.capabilities.requiredClearance);
    if (!routeNodeIds && findDomainRoute(graph, source, destination, request.capabilities.requiredClearance, true)) {
      return { ...measuredBase, kind: "pending", reason: "unknown_region", requiredAssets: [] };
    }
    if (!routeNodeIds && findDomainRoute(graph, source, destination, 1)) {
      return { ...measuredBase, kind: "impossible", reason: "insufficient_clearance", requiredAssets: [] };
    }
    if (routeNodeIds) {
      return {
        ...measuredBase,
        kind: "direct",
        domain: directDomain,
        routeNodeIds,
        firingNodeId: request.kind === "firing_position" ? destination.nodeId : null,
        requiredAssets: [
          directDomain === "ground" ? "ground_force" : directDomain === "water" ? "naval_force" : "air_force"
        ]
      };
    }
  }
  if (request.capabilities.moverDomains.includes("air")) {
    return {
      ...measuredBase,
      kind: "direct",
      domain: "air",
      routeNodeIds: [source.nodeId, destination.nodeId],
      firingNodeId: request.kind === "firing_position" ? destination.nodeId : null,
      requiredAssets: ["air_force"]
    };
  }
  if (request.kind === "firing_position") {
    const objectiveDomain = (["air", "water"] as const).find(
      (domain) => request.capabilities.targetDomains.includes(domain) && destination.domain === domain
    );
    if (objectiveDomain) {
      return {
        ...measuredBase,
        kind: "air_or_naval_objective",
        domain: objectiveDomain,
        firingNodeId: destination.nodeId,
        requiredAssets: [objectiveDomain === "air" ? "air_force" : "naval_force"]
      };
    }
  }
  const pickup = graph.transferPoints.filter((point) => point.kind === "shore" && point.fromNodeId === source.nodeId);
  const landing = graph.transferPoints.filter(
    (point) => point.kind === "shore" && point.fromNodeId === destination.nodeId
  );
  const compatiblePair = pickup
    .flatMap((left) => landing.map((right) => ({ left, right })))
    .filter(({ left, right }) => {
      const leftWater = graph.nodes.find((node) => node.nodeId === left.toNodeId);
      const rightWater = graph.nodes.find((node) => node.nodeId === right.toNodeId);
      return (
        leftWater && rightWater && findDomainRoute(graph, leftWater, rightWater, request.capabilities.requiredClearance)
      );
    })
    .sort(
      (a, b) =>
        a.left.transferId.localeCompare(b.left.transferId) || a.right.transferId.localeCompare(b.right.transferId)
    )[0];
  const unknownWaterPair =
    !compatiblePair &&
    pickup.some((left) =>
      landing.some((right) => {
        const leftWater = graph.nodes.find((node) => node.nodeId === left.toNodeId);
        const rightWater = graph.nodes.find((node) => node.nodeId === right.toNodeId);
        return (
          leftWater &&
          rightWater &&
          findDomainRoute(graph, leftWater, rightWater, request.capabilities.requiredClearance, true)
        );
      })
    );
  if (unknownWaterPair) {
    return { ...measuredBase, kind: "pending", reason: "unknown_region", requiredAssets: [] };
  }
  const seats = request.capabilities.requiredPassengerSeats;
  if (
    compatiblePair &&
    (request.capabilities.waterTransportSeats >= seats || request.capabilities.canProduceWaterTransport === true)
  ) {
    return {
      ...measuredBase,
      distanceCost: Math.floor(
        routeDistance(source, destination) +
          Math.abs(compatiblePair.left.carrierPosition.x - compatiblePair.right.carrierPosition.x) +
          Math.abs(compatiblePair.left.carrierPosition.y - compatiblePair.right.carrierPosition.y)
      ),
      kind: "water_transport",
      pickupCandidates: pickup.filter((point) => point.toNodeId === compatiblePair.left.toNodeId),
      landingCandidates: landing.filter((point) => point.toNodeId === compatiblePair.right.toNodeId),
      minimumSeats: seats,
      requiredAssets: ["ground_force", "water_transport"]
    };
  }
  if (request.capabilities.airTransportSeats >= seats || request.capabilities.canProduceAirTransport === true) {
    const airNode = graph.nodes.find((node) => node.domain === "air");
    if (airNode) {
      const makeAirPoint = (kind: "air_pickup" | "air_drop", node: AiAccessRegionV1): AiAccessTransferPointV1 => ({
        transferId: `transfer:${kind}:${node.nodeId}`,
        kind,
        fromNodeId: node.nodeId,
        toNodeId: airNode.nodeId,
        passengerPosition: node.representativePosition,
        carrierPosition: node.representativePosition,
        clearance: node.clearance,
        knowledge: node.knowledge
      });
      return {
        ...measuredBase,
        kind: "air_transport",
        pickupCandidates: [makeAirPoint("air_pickup", source)],
        landingCandidates: [makeAirPoint("air_drop", destination)],
        minimumSeats: seats,
        requiredAssets: ["ground_force", "air_transport"]
      };
    }
  }
  return {
    ...measuredBase,
    kind: "impossible",
    reason: pickup.length || landing.length ? "no_executable_transfer" : "no_compatible_domain",
    requiredAssets: []
  };
}
