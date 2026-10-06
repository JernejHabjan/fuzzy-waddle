import { expect, test } from "@playwright/test";
import { ConstructionStateEnum, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeConstructionV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-construction-v1";
import { constructionDecisionFixture } from "./skirmish-ai-runtime-construction-decision-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { normalizeRuntimeConstructionAuthority } from "./skirmish-ai-runtime-construction-authority";
import { normalizeRuntimeProductionSpatial } from "./skirmish-ai-runtime-production-spatial-normalization";
import { projectRuntimeConstructionLineage } from "./skirmish-ai-runtime-construction-lineage-projection";

function fixture() {
  const base = constructionDecisionFixture();
  const placement = base.facts.find((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "placement");
  if (!placement || placement.kind !== "spatial_authority" || placement.spatial.kind !== "placement") {
    throw new Error("synthetic_placement_missing");
  }
  const before: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const resource = { kind: "resource", site: placement.spatial.site, state: ConstructionStateEnum.NotStarted,
    remainingWorkMs: 0, snapshotRestoreInProgress: false, sceneActive: true, clockTick: 20,
    operation: "cancel_refund", status: "returned", ownerArgument: 1, configuredCostType: 1, requiredWorkMs: 150,
    configuredCost: { food: 11 }, requested: { food: 5 }, refundFactor: 0.5, before, after: { ...before, food: 105 },
    callbackAmounts: { food: 5 }, callbackCount: 1, nestedEmission: false, balanceMatches: true } satisfies AiRuntimeConstructionV1;
  const boundary = (construction: AiRuntimeConstructionV1, sequence = 10): AiRuntimeProductionFactV1 =>
    ({ kind: "construction_authority", tick: 20, playerNumber: 1, sequence, construction });
  const initialConstruction = { tick: base.startedTick, snapshotRestoreInProgress: false,
    sites: [{ site: resource.site, state: resource.state, remainingWorkMs: 0 }], gaps: [] };
  const initialSite = initialConstruction.sites[0];
  if (!initialSite) throw new Error("synthetic_initial_site_missing");
  return { base, placement, resource, boundary, initialConstruction, initialSite };
}

test("automatic sites join exact accepted construction without a builder path and preserve repeated refund attempts", () => {
  const f = fixture();
  const facts = f.base.facts.filter((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "builder_path")
    .map((fact): AiRuntimeProductionFactV1 => fact.kind === "spatial_authority" && fact.spatial.kind === "placement"
      ? { ...fact, spatial: { ...fact.spatial, catalog: { priceSource: "shared_command_base_definition",
        admissionCost: { food: 7 }, siteDefinition: null } } } : fact);
  const result = normalizeRuntimeProductionCausality({ ...f.base, facts: [...facts,
    f.boundary(f.resource), f.boundary({ ...f.resource, configuredCost: { food: 20 }, requested: { food: 10 },
      callbackAmounts: { food: 10 }, before: { ...f.resource.before, food: 105 }, after: { ...f.resource.after, food: 115 } }, 11)] });
  expect(result.failures).toEqual([]); expect(result.constructionLineage).toHaveLength(2);
  expect(result.spatialAuthority.paths).toEqual([]);
  for (const entry of result.constructionLineage) {
    expect(entry).toMatchObject({ origin: "placement", initialSite: null, placement: { sequence: 5 },
      application: { outcome: { kind: "applied", worldLinkIds: ["site"] } },
      commandScope: { acceptedIntent: { demandId: "demand:force" }, decision: { sequence: 1 } } });
    expect(entry.gaps).toContain("production_construction_cancellation_command_identity_missing");
  }
  expect(result.gaps).not.toContain("production_construction_ai_lifecycle_identity_missing");
  expect(result.gaps).toContain("production_construction_payment_history_missing");
  expect(result.gaps).toContain("production_construction_site_lifetime_history_unverified");
  expect(result.constructionCatalog[0]).toMatchObject({ acceptedDecision: { decisionSequence: 1 },
    acceptedDemandId: "demand:force", pricing: { admissionCost: { food: 7 } } });
});

test("native callbacks before applied outcome and receipt can retain retrospective admission without changing path timing", () => {
  const f = fixture();
  const receipt = f.base.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished");
  if (!receipt) throw new Error("synthetic_receipt_missing");
  const skipped = { ...f.resource, operation: "start_charge" as const, status: "skipped" as const,
    ownerArgument: null, requested: null, refundFactor: null, before: null, after: null,
    callbackAmounts: null, callbackCount: 0, balanceMatches: false };
  const native = f.base.facts.filter((fact) => fact !== receipt &&
    (fact.kind !== "spatial_authority" || fact.spatial.kind !== "builder_path"));
  const placementIndex = native.indexOf(f.placement);
  const facts = [...native.slice(0, placementIndex + 1), f.boundary(skipped),
    ...native.slice(placementIndex + 1), receipt].map((fact, index): AiRuntimeProductionFactV1 => {
      if (fact.kind === "decision_selected") return { ...fact, sequence: index + 1, tick: 20,
        decision: { ...fact.decision, identity: { ...fact.decision.identity, tick: 20 } } };
      if (fact.kind === "intent_dispatch" && fact.event.kind === "requested") return { ...fact, sequence: index + 1, tick: 20,
        event: { ...fact.event, decisionIdentity: fact.event.decisionIdentity
          ? { ...fact.event.decisionIdentity, tick: 20 } : undefined } };
      return { ...fact, tick: 20, sequence: index + 1 };
    });
  const result = normalizeRuntimeProductionCausality({ ...f.base, facts });
  expect(result.failures).toEqual([]);
  const entry = result.constructionLineage[0];
  expect(entry?.commandScope?.receiptSequence).toBeGreaterThan(entry?.boundary.sequence ?? 0);
  expect(entry?.application?.sequence).toBeGreaterThan(entry?.boundary.sequence ?? 0);
});

test("installation membership reaches reports without claiming initial setup, paid provenance or AI placement", () => {
  const f = fixture();
  const capture = { ...f.base, facts: [f.boundary(f.resource, 1)], initialConstruction: f.initialConstruction };
  const result = normalizeRuntimeProductionCausality(capture);
  expect(result.failures).toEqual([]); expect(result.initialConstruction).toEqual(f.initialConstruction);
  expect(result.constructionLineage[0]).toMatchObject({ origin: "capture_initial", placement: null,
    commandScope: null, application: null, initialSite: { site: { actorId: "site" } } });
  expect(result.gaps).toContain("production_construction_pre_capture_placement_payment_missing");
  const legacy = normalizeRuntimeProductionCausality({ ...capture, initialConstruction: undefined });
  expect(legacy.initialConstruction).toBeNull(); expect(legacy.constructionLineage[0]?.origin).toBe("unavailable");
});

test("started and finish-before-effects boundaries retain command identity without claiming completed useful products", () => {
  const f = fixture();
  const started = { kind: "lifecycle", site: f.resource.site, state: ConstructionStateEnum.Constructing,
    remainingWorkMs: 150, snapshotRestoreInProgress: false, sceneActive: true, clockTick: 20, transition: "started" }
    satisfies AiRuntimeConstructionV1;
  const finished = { ...started, site: { ...started.site, finished: true }, state: ConstructionStateEnum.Finished,
    remainingWorkMs: -5, transition: "finished" } satisfies AiRuntimeConstructionV1;
  const result = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [...f.base.facts, f.boundary(started), f.boundary(finished, 11)] });
  expect(result.failures).toEqual([]); expect(result.constructionLineage).toHaveLength(2);
  expect(result.constructionLineage[1]?.commandScope?.decision?.decision.identity.decisionSequence).toBe(1);
  expect(result.gaps).toContain("production_construction_completion_effect_missing");
});

test("illegal native placement retains exact admission but cannot supply applied construction", () => {
  const f = fixture();
  const facts = f.base.facts.filter((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "builder_path")
    .map((fact): AiRuntimeProductionFactV1 => {
      if (fact.kind === "spatial_authority" && fact.spatial.kind === "placement") {
        return { ...fact, spatial: { ...fact.spatial, legal: false } };
      }
      if (fact.kind === "outcome" && fact.outcome.kind === "applied") {
        return { ...fact, outcome: { ...fact.outcome, kind: "rejected", reason: "illegal_site", worldLinkIds: [] } };
      }
      return fact;
    });
  const result = normalizeRuntimeProductionCausality({ ...f.base, facts: [...facts, f.boundary(f.resource)] });
  expect(result.failures).toEqual([]); expect(result.constructionLineage[0]).toMatchObject({
    origin: "placement", placement: { spatial: { legal: false } }, application: null,
    commandScope: { command: { execution: { commandId: "construction" } } } });
});

test("restore and subsequent callbacks cannot reuse an earlier placement, including manual setData outside restore", () => {
  const f = fixture();
  const restored = { kind: "lifecycle", site: f.resource.site, state: ConstructionStateEnum.NotStarted,
    remainingWorkMs: 0, snapshotRestoreInProgress: false, sceneActive: true, clockTick: 20, transition: "restored" }
    satisfies AiRuntimeConstructionV1;
  const result = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [...f.base.facts, f.boundary(restored), f.boundary(f.resource, 11)] });
  expect(result.failures).toEqual([]);
  expect(result.constructionLineage.map((entry) => [entry.origin, entry.placement, entry.commandScope]))
    .toEqual([["restore", null, null], ["restore", null, null]]);
  const initial = normalizeRuntimeProductionCausality({ ...f.base, facts: [f.boundary(f.resource, 1)],
    initialConstruction: { ...f.initialConstruction, snapshotRestoreInProgress: true } });
  expect(initial.constructionLineage[0]?.origin).toBe("restore");
  const changed = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [...f.base.facts, f.boundary({ ...restored,
      site: { ...f.resource.site, canonicalObjectName: ObjectNames.AnkGuard } })] });
  expect(changed.failures).toEqual([]); expect(changed.constructionLineage[0]?.origin).toBe("restore");
});

test("unregister/re-registration fences reused IDs while repeated teardown boundaries stay separate", () => {
  const f = fixture();
  const teardown = { kind: "lifecycle", site: f.resource.site, state: ConstructionStateEnum.NotStarted,
    remainingWorkMs: 0, snapshotRestoreInProgress: false, sceneActive: true, clockTick: 20, transition: "teardown" }
    satisfies AiRuntimeConstructionV1;
  const repeated = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [...f.base.facts, f.boundary(teardown), f.boundary(teardown, 11)] });
  expect(repeated.constructionLineage).toHaveLength(2);
  const lost: AiRuntimeProductionFactV1 = { sequence: 10, tick: 20, playerNumber: 1, kind: "actor_unregistered",
    actorId: "site", objectName: f.resource.site.objectName };
  const reused: AiRuntimeProductionFactV1 = { sequence: 11, tick: 20, playerNumber: 1, kind: "actor_registered",
    actor: f.resource.site, snapshotRestoreInProgress: false };
  const result = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [...f.base.facts, lost, reused, f.boundary(f.resource, 12)] });
  expect(result.failures).toEqual([]); expect(result.constructionLineage[0]).toMatchObject({
    origin: "unavailable", placement: null, commandScope: null });
});

test("future placement never backfills an earlier callback and missing application retains only admission", () => {
  const f = fixture();
  const result = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [f.boundary(f.resource, 1), { ...f.placement, sequence: 2 }] });
  expect(result.failures).toEqual([]); expect(result.constructionLineage[0]?.origin).toBe("unavailable");
  const missing = normalizeRuntimeProductionCausality({ ...f.base,
    facts: [...f.base.facts.filter((fact) => fact.kind !== "outcome" || fact.outcome.kind !== "applied"), f.boundary(f.resource)] });
  expect(missing.failures).toEqual([]); expect(missing.constructionLineage[0]?.application).toBeNull();
  expect(missing.constructionLineage[0]?.commandScope?.decision).not.toBeNull();
});

test("contradictory initial membership, native application and site lineage suppress all normalized groups", () => {
  const f = fixture();
  const captures: AiRuntimeProductionCaptureV1[] = [
    { ...f.base, initialConstruction: { ...f.initialConstruction, tick: 999 } },
    { ...f.base, initialConstruction: { ...f.initialConstruction, sites: [f.initialSite, f.initialSite] } },
    { ...f.base, facts: f.base.facts.map((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied"
      ? { ...fact, outcome: { ...fact.outcome, worldLinkIds: ["wrong-site"] } } : fact) },
    { ...f.base, facts: f.base.facts.map((fact) => fact.kind === "command_delivered"
      ? { ...fact, command: { ...fact.command, tick: 19 } } : fact) },
    { ...f.base, facts: f.base.facts.map((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied"
      ? { ...fact, outcome: { ...fact.outcome, authorityEpoch: 9 } } : fact) },
    { ...f.base, facts: [...f.base.facts, { ...f.placement, sequence: 10 }] },
    { ...f.base, initialConstruction: { ...f.initialConstruction,
      sites: [{ ...f.initialSite, site: { ...f.initialSite.site, finished: true } }] } }
  ];
  for (const capture of captures) {
    const result = normalizeRuntimeProductionCausality({ ...capture, facts: [...capture.facts, f.boundary(f.resource, 11)] });
    expect(result.failures.length).toBeGreaterThan(0); expect(result.constructionLineage).toEqual([]);
    expect(result.initialConstruction).toBeNull(); expect(result.constructionAuthority).toEqual([]);
    expect(result.worldSnapshots).toEqual([]); expect(result.payments).toEqual([]); expect(result.constructionCatalog).toEqual([]);
  }
  const mismatch = normalizeRuntimeProductionCausality({ ...f.base, facts: [...f.base.facts,
    f.boundary({ ...f.resource, site: { ...f.resource.site, canonicalObjectName: ObjectNames.AnkGuard } })] });
  expect(mismatch.failures).toContain("production_construction_lineage_site_mismatch");
  expect(mismatch.constructionLineage).toEqual([]);
  const variant = normalizeRuntimeProductionCausality({ ...f.base, facts: [...f.base.facts,
    f.boundary({ ...f.resource, site: { ...f.resource.site, objectName: "another-native-variant" } })] });
  expect(variant.failures).toEqual([]);
  expect(variant.gaps).toContain("production_construction_object_name_history_unverified");
});

test("inventory/lineage overflow and reader loss never expose partial membership or lineage", () => {
  const f = fixture();
  for (const gap of ["production_construction_initial_overflow", "production_construction_initial_reader_missing"]) {
    const result = normalizeRuntimeProductionCausality({ ...f.base, facts: [f.boundary(f.resource, 1)],
      initialConstruction: { ...f.initialConstruction, sites: [], gaps: [gap] } });
    expect(result.failures).toEqual([]); expect(result.initialConstruction).toBeNull();
    expect(result.constructionLineage[0]?.origin).toBe("unavailable");
  }
  const capture = { ...f.base, facts: Array.from({ length: 257 }, (_, index) => f.boundary(f.resource, index + 1)) };
  const raw = normalizeRuntimeConstructionAuthority(capture);
  const direct = projectRuntimeConstructionLineage(capture, normalizeRuntimeProductionSpatial(f.base).authority,
    capture.facts.filter((fact) => fact.kind === "construction_authority"));
  expect(raw.records).toEqual([]); expect(direct.entries).toEqual([]);
  expect(direct.gaps).toContain("production_construction_lineage_overflow");
});
