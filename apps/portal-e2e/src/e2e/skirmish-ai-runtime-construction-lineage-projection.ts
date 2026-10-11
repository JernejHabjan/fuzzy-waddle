import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionSpatialAuthorityV1 } from "./skirmish-ai-runtime-production-spatial-authority";
import type { RuntimeConstructionLineageV1 } from "./skirmish-ai-runtime-construction-lineage";
import { normalizeRuntimeInitialConstruction } from "./skirmish-ai-runtime-initial-construction";
import { matchRuntimeConstructionDecision } from "./skirmish-ai-runtime-construction-decision-lineage";
import { matchRuntimeConstructionApplication } from "./skirmish-ai-runtime-construction-application";

/**
 * Links each validated attempt separately to its earlier exact site placement. Restore, unregister/re-registration
 * and missing installation authority fence provenance; prices/balances/later actor snapshots never supply a join.
 * This retrospective report is not an online AI observation or a completed/paid/useful-effect ledger.
 */
export function projectRuntimeConstructionLineage(
  capture: AiRuntimeProductionCaptureV1, spatial: RuntimeProductionSpatialAuthorityV1,
  records: readonly RuntimeConstructionLineageV1["boundary"][]
) {
  const initial = normalizeRuntimeInitialConstruction(capture);
  const failures = [...initial.failures];
  const gaps = new Set(initial.gaps);
  const entries: RuntimeConstructionLineageV1[] = [];
  if (records.length > 256 || spatial.placements.length > 256) {
    gaps.add("production_construction_lineage_overflow");
    return { entries, initial: initial.initial, failures, gaps: [...gaps].sort() };
  }
  for (const boundary of records) {
    const local = new Set<string>();
    const value = boundary.construction;
    const id = value.site.actorId;
    const candidates = spatial.placements.filter((fact) => fact.spatial.kind === "placement" &&
      fact.spatial.site.actorId === id && fact.sequence < boundary.sequence);
    if (candidates.length > 1) failures.push("production_construction_lineage_ambiguous_placement");
    let placement = candidates.length === 1 ? candidates[0] ?? null : null;
    let initialSite = placement ? null : initial.initial?.sites.find((entry) => entry.site.actorId === id) ?? null;
    if (initialSite && !initialSite.site.indexed) {
      initialSite = null; local.add("production_construction_initial_binding_missing");
    }
    const startSequence = placement?.sequence ?? 0;
    const interval = capture.facts.filter((fact) => fact.sequence > startSequence && fact.sequence <= boundary.sequence);
    const restored = value.snapshotRestoreInProgress ||
      (!placement && !!initialSite && initial.initial?.snapshotRestoreInProgress === true) || interval.some((fact) =>
        (fact.kind === "construction_authority" && fact.construction.site.actorId === id &&
          (fact.construction.snapshotRestoreInProgress ||
            (fact.construction.kind === "lifecycle" && fact.construction.transition === "restored"))) ||
        (fact.kind === "actor_registered" && fact.actor.actorId === id && fact.snapshotRestoreInProgress));
    const registration = interval.some((fact) => fact.kind === "actor_registered" && fact.actor.actorId === id);
    const unregistered = interval.some((fact) => fact.kind === "actor_unregistered" && fact.actorId === id);
    const binding = placement?.spatial.kind === "placement" ? placement.spatial.site : initialSite?.site;
    // A reused ID cannot resurrect an old site's placement or installation membership.
    if (restored || registration || unregistered || !id) {
      placement = null; initialSite = null;
      local.add(restored ? "production_construction_restore_lineage_missing" : "production_construction_site_interval_missing");
    } else if (binding) {
      if (binding.canonicalObjectName !== value.site.canonicalObjectName || binding.playerNumber !== value.site.playerNumber) {
        failures.push("production_construction_lineage_site_mismatch");
      }
      if (binding.objectName !== value.site.objectName) local.add("production_construction_object_name_history_unverified");
    }
    const origin = restored ? "restore" : placement ? "placement" : initialSite ? "capture_initial" : "unavailable";
    const admission = placement ? matchRuntimeConstructionDecision(capture, placement) : null;
    const applied = placement ? matchRuntimeConstructionApplication(capture, placement) : null;
    admission?.failures.forEach((failure) => failures.push(failure));
    applied?.failures.forEach((failure) => failures.push(failure));
    admission?.gaps.forEach((gap) => local.add(gap));
    applied?.gaps.forEach((gap) => local.add(gap));
    if (!admission?.scope) local.add("production_construction_ai_lifecycle_identity_missing");
    if (origin === "unavailable") local.add("production_construction_placement_or_initial_ownership_missing");
    if (initialSite) local.add("production_construction_pre_capture_placement_payment_missing");
    if (!value.site.indexed || !value.sceneActive || value.clockTick === null) local.add("production_construction_live_binding_missing");
    if (value.kind === "resource" && value.operation === "cancel_refund") {
      local.add("production_construction_cancellation_command_identity_missing");
    }
    local.forEach((gap) => gaps.add(gap));
    entries.push({ boundary, origin, placement, initialSite, commandScope: admission?.scope ?? null,
      application: applied?.application ?? null, gaps: [...local].sort() });
  }
  if (!records.length) gaps.add("production_construction_lineage_missing");
  return structuredClone({ entries: failures.length ? [] : entries, initial: initial.initial,
    failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
