import type { AiCapabilityCatalogEntryV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiAdaptationRole } from "./ai-adaptation-role";

/** Matches a role against real catalog capabilities, not a fictional RTS unit name. */
export function matchesAdaptationRole(entry: AiCapabilityCatalogEntryV1, role: AiAdaptationRole): boolean {
  const family = entry.family.toLowerCase();
  switch (role) {
    case "anti_air":
      return entry.targetDomains.includes("air");
    case "water_control":
      return entry.movementDomains.includes("water") && entry.targetDomains.includes("water");
    case "ranged":
      return family.includes("range") || family.includes("spell");
    case "support":
      return family.includes("heal") || family.includes("support") || family.includes("spell");
    case "fortification_breaker":
      return entry.movementDomains.includes("air") || family.includes("range") || family.includes("spell");
    case "frontline":
      return !family.includes("range") && !family.includes("heal") && entry.targetDomains.includes("ground");
  }
}
