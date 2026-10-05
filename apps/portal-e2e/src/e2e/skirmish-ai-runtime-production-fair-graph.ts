import type { AiAccessGraphV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

/** Checks supplied committed topology only; no new pathfinding or inferred connectivity is permitted. */
export function validateRuntimeProductionFairGraph(graph: AiAccessGraphV1, tick: number): string[] {
  if (graph.nodes.length > 512 || graph.links.length > 2048 || graph.transferPoints.length > 512 ||
    graph.unknownNodeIds.length > 512) return ["production_decision_graph_invalid"];
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const domains = ["ground", "water", "air"];
  const knowledge = ["known_static", "observed_dynamic", "unknown"];
  const position = (value: { x: number; y: number; z: number }) => [value.x, value.y, value.z].every(Number.isFinite);
  const ids = graph.nodes.map((node) => node.nodeId);
  const unique = (values: readonly string[]) => values.every(Boolean) && new Set(values).size === values.length;
  if (graph.schemaVersion !== 1 || !["ready", "pending", "service_failed"].includes(graph.status) ||
    ![graph.generation, graph.staticRevision, graph.dynamicRevision, graph.threatRevision,
      graph.builtTick, graph.continuationCursor].every(integer) || graph.builtTick > tick ||
    !unique(ids) || !unique(graph.links.map((link) => link.linkId)) ||
    !unique(graph.transferPoints.map((point) => point.transferId)) || !unique(graph.unknownNodeIds) ||
    graph.unknownNodeIds.some((id) => !ids.includes(id)) || graph.nodes.some((node) =>
      !domains.includes(node.domain) || !knowledge.includes(node.knowledge) || !Number.isFinite(node.elevation) ||
      !position(node.representativePosition) || !integer(node.tileCount) ||
      !integer(node.clearance)) || graph.links.some((link) =>
      !ids.includes(link.fromNodeId) || !ids.includes(link.toNodeId) || !domains.includes(link.domain) ||
      !knowledge.includes(link.knowledge) || !integer(link.clearance) ||
      !integer(link.distanceCost)) || graph.transferPoints.some((point) =>
      !ids.includes(point.fromNodeId) || !ids.includes(point.toNodeId) ||
      !["shore", "air_pickup", "air_drop"].includes(point.kind) || !knowledge.includes(point.knowledge) ||
      !integer(point.clearance) || !position(point.passengerPosition) || !position(point.carrierPosition))) {
    return ["production_decision_graph_invalid"];
  }
  return [];
}
