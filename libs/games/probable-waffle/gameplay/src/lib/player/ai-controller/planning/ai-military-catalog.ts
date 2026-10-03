import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

export function roleFor(objectName: ObjectNames, catalog: AiCapabilityCatalogV1): "frontline" | "ranged" | "support" {
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
  const family = entry?.family.toLowerCase() ?? "";
  if (family.includes("heal") || family.includes("support")) return "support";
  if (family.includes("range")) return "ranged";
  return "frontline";
}

export function isMilitaryCatalogEntry(entry: AiCapabilityCatalogV1["entries"][number]): boolean {
  return entry.gathers.length === 0 && entry.targetDomains.length > 0;
}

export function producerMilitaryProducts(
  objectName: ObjectNames,
  catalog: AiCapabilityCatalogV1,
  movementDomain?: "ground" | "air" | "water"
): readonly ObjectNames[] {
  const producer = catalog.entries.find((entry) => entry.sourceObjectName === objectName);
  return (producer?.produces ?? [])
    .filter((candidate) => {
      const product = catalog.entries.find((entry) => entry.sourceObjectName === candidate);
      return (
        product !== undefined &&
        isMilitaryCatalogEntry(product) &&
        (movementDomain === undefined || product.movementDomains.includes(movementDomain))
      );
    })
    .sort();
}

/** Gives each combat role a bounded share instead of treating support as unlimited frontline. */
export function productionRoleDeficit(
  role: "frontline" | "ranged" | "support",
  counts: Readonly<{ frontline: number; ranged: number; support: number }>,
  targetForce: number,
  desiredRanged: number
): number {
  const desiredSupport = targetForce >= 8 ? 1 : 0;
  if (role === "ranged") return desiredRanged - counts.ranged;
  if (role === "support") return desiredSupport - counts.support;
  return targetForce - desiredRanged - desiredSupport - counts.frontline;
}
