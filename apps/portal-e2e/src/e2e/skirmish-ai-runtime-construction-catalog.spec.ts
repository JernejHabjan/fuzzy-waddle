import { expect, test } from "@playwright/test";
import type { AiRuntimeConstructionCatalogV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-construction-catalog-v1";
import { constructionDecisionFixture } from "./skirmish-ai-runtime-construction-decision-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { projectRuntimeConstructionCatalog } from "./skirmish-ai-runtime-construction-catalog-projection";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";

function fixture() {
  const catalog = { priceSource: "shared_command_base_definition", admissionCost: { food: 7 },
    siteDefinition: { researchedLevel: 2, cost: { food: 11 }, configuredPayment: "immediate", requiredWorkMs: 150 } }
    satisfies AiRuntimeConstructionCatalogV1;
  const capture = constructionDecisionFixture();
  return { catalog, capture: { ...capture, facts: capture.facts.map((fact) =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "placement"
      ? { ...fact, spatial: { ...fact.spatial, catalog } } : fact) } };
}

test("retains one command-priced entry and exact accepted decision without promoting configured price to paid effect", () => {
  const f = fixture(); const result = normalizeRuntimeProductionCausality(f.capture);
  expect(result.failures).toEqual([]); expect(result.constructionCatalog).toHaveLength(1);
  expect(result.constructionCatalog[0]).toMatchObject({ placementTick: 20, siteActorId: "site", legal: true,
    command: { actorIds: ["builder", "other-builder"], execution: { commandId: "construction" } }, pricing: f.catalog,
    acceptedDecision: { playerNumber: 1, tick: 18, decisionSequence: 1 }, acceptedDemandId: "demand:force" });
  expect(result.gaps).toContain("production_construction_actual_payment_missing");
  expect(result.gaps).toContain("production_construction_definition_history_missing");
  expect(result.gaps).toContain("production_ai_definition_catalog_missing");
});

test("legacy price loss and missing tech stay explicit; an unjoined placement needs no fabricated builder path", () => {
  const legacy = normalizeRuntimeProductionCausality(constructionDecisionFixture());
  expect(legacy.failures).toEqual([]); expect(legacy.constructionCatalog).toEqual([]);
  expect(legacy.gaps).toContain("production_construction_command_catalog_missing");
  const f = productionSpatialFixture(); const catalog = fixture().catalog;
  const native = normalizeRuntimeProductionCausality({ ...f.capture,
    facts: [f.fact({ ...f.placement, catalog: { ...catalog, siteDefinition: null } }, 1)] });
  expect(native.failures).toEqual([]);
  expect(native.constructionCatalog[0]).toMatchObject({ acceptedDecision: null, acceptedDemandId: null,
    pricing: { admissionCost: { food: 7 }, siteDefinition: null } });
  expect(native.gaps).toContain("production_construction_effective_definition_missing");
});

test("contradictory prices invalidate all normalized groups even for an unbound placement", () => {
  const f = fixture();
  for (const catalog of [
    { ...f.catalog, admissionCost: { food: Number.NaN } },
    { ...f.catalog, admissionCost: { food: -1 } },
    { ...f.catalog, admissionCost: { food: 7, credits: 1 } },
    { ...f.catalog, siteDefinition: { ...f.catalog.siteDefinition, researchedLevel: 0 } },
    { ...f.catalog, siteDefinition: { ...f.catalog.siteDefinition, cost: { food: Infinity } } },
    { ...f.catalog, siteDefinition: { ...f.catalog.siteDefinition, requiredWorkMs: -1 } }
  ]) {
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts: f.capture.facts.map((fact) =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "placement"
        ? { ...fact, spatial: { ...fact.spatial, footprint: null, catalog } } : fact) });
    expect(result.failures).toContain("production_construction_catalog_invalid");
    expect(result.constructionCatalog).toEqual([]); expect(result.worldSnapshots).toEqual([]);
    expect(result.effectRetention).toEqual([]); expect(result.payments).toEqual([]);
  }
});

test("duplicate command identity fails closed and overflow discards the complete catalog group", () => {
  const f = productionSpatialFixture(); const catalog = fixture().catalog;
  const placement = f.fact({ ...f.placement, catalog }, 1);
  const duplicate = projectRuntimeConstructionCatalog({ placements: [placement, { ...placement, sequence: 2 }], paths: [], spawns: [] });
  expect(duplicate.failures).toContain("production_construction_catalog_duplicate_command"); expect(duplicate.entries).toEqual([]);
  const overflow = projectRuntimeConstructionCatalog({
    placements: Array.from({ length: 257 }, (_, index) => ({ ...placement, sequence: index + 1 })), paths: [], spawns: [] });
  expect(overflow.failures).toEqual([]); expect(overflow.entries).toEqual([]);
  expect(overflow.gaps).toEqual(["production_construction_catalog_overflow"]);
});
