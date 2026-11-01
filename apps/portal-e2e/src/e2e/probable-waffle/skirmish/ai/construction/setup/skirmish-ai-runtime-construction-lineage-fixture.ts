import { ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFact } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { AiRuntimeConstruction } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/construction/ai-runtime-construction";
import { constructionDecisionFixture } from "./skirmish-ai-runtime-construction-decision-fixture";

/** Synthetic construction/refund boundaries shared by lineage controls; no real placement or payment evidence. */
export function constructionLineageFixture() {
  const base = constructionDecisionFixture();
  const placement = base.facts.find((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "placement");
  if (!placement || placement.kind !== "spatial_authority" || placement.spatial.kind !== "placement") {
    throw new Error("synthetic_placement_missing");
  }
  const before: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const resource = {
    kind: "resource",
    site: placement.spatial.site,
    state: ConstructionStateEnum.NotStarted,
    remainingWorkMs: 0,
    snapshotRestoreInProgress: false,
    sceneActive: true,
    clockTick: 20,
    operation: "cancel_refund",
    status: "returned",
    ownerArgument: 1,
    configuredCostType: 1,
    requiredWorkMs: 150,
    configuredCost: { food: 11 },
    requested: { food: 5 },
    refundFactor: 0.5,
    before,
    after: { ...before, food: 105 },
    callbackAmounts: { food: 5 },
    callbackCount: 1,
    nestedEmission: false,
    balanceMatches: true
  } satisfies AiRuntimeConstruction;
  const boundary = (construction: AiRuntimeConstruction, sequence = 10): AiRuntimeProductionFact => ({
    kind: "construction_authority",
    tick: 20,
    playerNumber: 1,
    sequence,
    construction
  });
  const initialConstruction = {
    tick: base.startedTick,
    snapshotRestoreInProgress: false,
    sites: [{ site: resource.site, state: resource.state, remainingWorkMs: 0 }],
    gaps: []
  };
  const initialSite = initialConstruction.sites[0];
  if (!initialSite) throw new Error("synthetic_initial_site_missing");
  return { base, placement, resource, boundary, initialConstruction, initialSite };
}
