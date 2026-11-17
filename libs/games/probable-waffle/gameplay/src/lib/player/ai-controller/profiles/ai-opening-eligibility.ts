import type { AiCapabilityCatalog } from "../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../contracts/observation/ai-observation";
import { matchesAdaptationRole } from "../planning/adaptation/ai-adaptation-role-match";
import type { AiAdaptationRole } from "../planning/adaptation/ai-adaptation-role";
import type { AiOpeningPurpose } from "./ai-opening-archetypes";

function hasProducerPath(catalog: AiCapabilityCatalog, role: AiAdaptationRole): boolean {
  return catalog.entries.some((producer) =>
    producer.produces.some((objectName) => {
      const product = catalog.entries.find((entry) => entry.sourceObjectName === objectName);
      return product !== undefined && matchesAdaptationRole(product, role);
    })
  );
}

function hasTransportProducerPath(catalog: AiCapabilityCatalog, domain: "air" | "water"): boolean {
  return catalog.entries.some((producer) =>
    producer.produces.some((objectName) => {
      const product = catalog.entries.find((entry) => entry.sourceObjectName === objectName);
      return product !== undefined && (product.cargoCapacity ?? 0) > 0 && product.movementDomains.includes(domain);
    })
  );
}

/**
 * Removes strategic openings that have no legal runtime roster or useful known map route.
 * The catalog is faction-scoped; map eligibility comes only from the committed observation.
 */
export function eligibleAiOpeningPurposes(
  observation: AiObservation,
  catalog: AiCapabilityCatalog
): readonly AiOpeningPurpose[] {
  const graph = observation.map?.accessGraph;
  const hasCoastalRoute =
    graph?.status === "ready" &&
    graph.nodes.some((node) => node.domain === "water") &&
    graph.transferPoints.some((transfer) => transfer.kind === "shore");
  const eligible = new Set<AiOpeningPurpose>([
    "balanced",
    "rush",
    "expansion",
    "macro",
    "tech",
    "harassment",
    "turtle"
  ]);
  if (hasProducerPath(catalog, "air_pressure")) eligible.add("turtle_air");
  if (hasProducerPath(catalog, "anti_air")) eligible.add("air_control");
  if (hasCoastalRoute && hasProducerPath(catalog, "water_control")) eligible.add("naval");
  const hasAirTransfer =
    graph?.status === "ready" &&
    graph.transferPoints.some((point) => point.kind === "air_pickup") &&
    graph.transferPoints.some((point) => point.kind === "air_drop");
  if (
    (hasCoastalRoute && hasTransportProducerPath(catalog, "water")) ||
    (hasAirTransfer && hasTransportProducerPath(catalog, "air"))
  )
    eligible.add("expeditionary");
  return [...eligible];
}
