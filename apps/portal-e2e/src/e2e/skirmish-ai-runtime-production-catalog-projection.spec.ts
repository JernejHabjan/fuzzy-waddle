import { expect, test } from "@playwright/test";
import { productionWorldFixture } from "./skirmish-ai-runtime-production-world-fixture";
import { normalizeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-normalization";
import { projectRuntimeProductionCatalog } from "./skirmish-ai-runtime-production-catalog-projection";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";

test("catalog uses actual producer definitions rather than inferred queue prices", () => {
  const { capture } = productionWorldFixture();
  const world = normalizeRuntimeProductionWorld(capture);
  const result = projectRuntimeProductionCatalog({
    worldSnapshots: world.snapshots,
    queueMutations: [],
    constructionCatalog: []
  });
  expect(result.failures).toEqual([]);
  expect(result.catalog).toHaveLength(1);
  expect(result.catalog[0]).toMatchObject({
    kind: "production",
    payment: "immediate",
    durationTicks: 3,
    cost: { food: 7 }
  });
});

test("different sampled prices cannot collapse into a falsely stable global catalog", () => {
  const { capture } = productionWorldFixture();
  const world = normalizeRuntimeProductionWorld(capture).snapshots[0];
  expect(world).toBeDefined();
  if (!world) throw new Error("synthetic_world_missing");
  const changed = { ...world, tick: 10, catalog: world.catalog.map((entry) => ({ ...entry, cost: { food: 99 } })) };
  expect(
    projectRuntimeProductionCatalog({ worldSnapshots: [world, changed], queueMutations: [], constructionCatalog: [] })
  ).toMatchObject({ catalog: [], failures: ["production_ai_catalog_definition_changed"] });
});

test("physical enqueue must match its producer's preceding shared definition", () => {
  const causal = normalizeRuntimeProductionCausality(productionQueueMutationFixture("immediate"));
  const { capture } = productionWorldFixture();
  const world = normalizeRuntimeProductionWorld(capture).snapshots[0];
  if (!world) throw new Error("synthetic_world_missing");
  const initial = { ...world, tick: 0, afterSequence: 0 };
  const valid = { worldSnapshots: [initial], queueMutations: causal.queueMutations, constructionCatalog: [] };
  expect(projectRuntimeProductionCatalog(valid).failures).toEqual([]);
  const wrong = {
    ...valid,
    queueMutations: causal.queueMutations.map((entry) => ({ ...entry, item: { ...entry.item, charge: { food: 999 } } }))
  };
  expect(projectRuntimeProductionCatalog(wrong)).toMatchObject({
    catalog: [],
    failures: ["production_ai_catalog_enqueue_price_or_duration_mismatch"]
  });
  expect(projectRuntimeProductionCatalog({ ...valid, worldSnapshots: [] }).gaps).toContain(
    "production_ai_catalog_enqueue_definition_missing"
  );
});
