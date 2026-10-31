import type { RuntimeProductionSpatialAuthorityV1 } from "./skirmish-ai-runtime-production-spatial-authority";
import type { RuntimeConstructionCatalogEntryV1 } from "./skirmish-ai-runtime-construction-catalog-entry";
import type { RuntimeConstructionLineageV1 } from "./skirmish-ai-runtime-construction-lineage";

/** Consumes validated native placements and exact existing scopes; autonomous/legacy sites need no invented path. */
export function projectRuntimeConstructionCatalog(
  authority: RuntimeProductionSpatialAuthorityV1, lineage: readonly RuntimeConstructionLineageV1[] = []
) {
  const entries: RuntimeConstructionCatalogEntryV1[] = [];
  const failures: string[] = [];
  const gaps = new Set<string>();
  if (authority.placements.length > 256) {
    return { entries, failures, gaps: ["production_construction_catalog_overflow"] };
  }
  const commandIds = new Set<string>();
  for (const fact of authority.placements) {
    const placement = fact.spatial;
    if (placement.kind !== "placement") continue;
    const commandId = placement.command.execution?.commandId;
    if (!commandId || commandIds.has(commandId)) {
      failures.push("production_construction_catalog_duplicate_command"); continue;
    }
    commandIds.add(commandId);
    const pricing = placement.catalog;
    if (!pricing) { gaps.add("production_construction_command_catalog_missing"); continue; }
    if (!placement.site.actorId) { gaps.add("production_construction_catalog_site_binding_missing"); continue; }
    const scope = authority.paths.find((path) => path.constructionPlacement?.sequence === fact.sequence &&
      path.constructionCommand)?.constructionCommand ?? lineage.find((entry) =>
        entry.placement?.sequence === fact.sequence && entry.commandScope)?.commandScope;
    if (!scope?.decision) gaps.add("production_construction_catalog_ai_identity_missing");
    if (!pricing.siteDefinition) gaps.add("production_construction_effective_definition_missing");
    entries.push({ placementSequence: fact.sequence, placementTick: fact.tick, command: placement.command,
      siteActorId: placement.site.actorId, legal: placement.legal, pricing,
      acceptedDecision: scope?.decision?.decision.identity ?? null, acceptedDemandId: scope?.acceptedIntent.demandId ?? null });
  }
  if (!authority.placements.length) gaps.add("production_construction_command_catalog_missing");
  if (entries.length) {
    gaps.add("production_construction_actual_payment_missing");
    gaps.add("production_construction_definition_history_missing");
  }
  return structuredClone({ entries: failures.length ? [] : entries, failures, gaps: [...gaps].sort() });
}
