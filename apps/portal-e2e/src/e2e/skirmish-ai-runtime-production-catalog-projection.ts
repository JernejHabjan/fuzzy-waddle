import { isDeepStrictEqual } from "node:util";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Checks every captured definition and stored queue price; a changing definition cannot become a global price table. */
export function projectRuntimeProductionCatalog(
  causal: Pick<RuntimeProductionCausalityV1, "worldSnapshots" | "queueMutations" | "constructionCatalog">
) {
  const entries = new Map<string, RuntimeProductionEvidenceV1["catalog"][number]>();
  const failures: string[] = [],
    gaps: string[] = [];
  const add = (entry: RuntimeProductionEvidenceV1["catalog"][number]) => {
    const previous = entries.get(entry.productKey);
    if (previous && !isDeepStrictEqual(previous, entry)) failures.push("production_ai_catalog_definition_changed");
    else entries.set(entry.productKey, entry);
  };
  for (const world of causal.worldSnapshots) {
    if (world.gaps.length) gaps.push("production_ai_catalog_world_partial");
    for (const option of world.catalog) {
      add({
        productKey: option.productKey,
        kind: option.kind,
        cost: { ...option.cost },
        payment: option.payment,
        durationTicks: option.durationTicks
      });
    }
  }
  for (const construction of causal.constructionCatalog) {
    const definition = construction.pricing.siteDefinition;
    if (!definition || !sameRuntimeQueueVector(construction.pricing.admissionCost, definition.cost)) {
      gaps.push("production_ai_catalog_construction_price_unavailable");
      continue;
    }
    add({
      productKey: construction.command.actorName,
      kind: "construction",
      cost: { ...definition.cost },
      payment: definition.configuredPayment,
      durationTicks: Math.ceil(definition.requiredWorkMs / 50)
    });
  }
  for (const mutation of causal.queueMutations.filter((entry) => entry.operation === "enqueue")) {
    const productKey = mutation.item.objectName ?? mutation.item.researchType;
    const worlds = causal.worldSnapshots.filter(
      (world) =>
        world.tick <= mutation.tick &&
        world.afterSequence !== null &&
        world.afterSequence < mutation.boundarySequences[0]
    );
    const world = worlds.at(-1);
    const definition = world?.catalog.find(
      (entry) =>
        entry.producerActorId === mutation.actorId &&
        entry.productKey === productKey &&
        entry.kind === (mutation.item.objectName ? "production" : "research")
    );
    if (!definition) {
      gaps.push("production_ai_catalog_enqueue_definition_missing");
      continue;
    }
    if (
      definition.payment !== mutation.item.payment ||
      definition.durationMs !== mutation.item.totalTimeMs ||
      !sameRuntimeQueueVector(definition.cost, mutation.item.charge)
    ) {
      failures.push("production_ai_catalog_enqueue_price_or_duration_mismatch");
    }
  }
  if (!entries.size) gaps.push("production_ai_definition_catalog_missing");
  return structuredClone({
    catalog: failures.length ? [] : [...entries.values()].sort((a, b) => a.productKey.localeCompare(b.productKey)),
    failures: [...new Set(failures)],
    gaps: [...new Set(gaps)]
  });
}
