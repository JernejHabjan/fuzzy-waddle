import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Initial membership is installation-owned. Tick-zero presence alone is never paired setup or paid provenance. */
export function normalizeRuntimeInitialConstruction(capture: AiRuntimeProductionCaptureV1) {
  const initial = capture.initialConstruction;
  const failures: string[] = [];
  const gaps = new Set<string>(["production_construction_initial_setup_identity_missing",
    "production_construction_initial_payment_history_missing"]);
  if (!initial) return { initial: null, failures, gaps: [...gaps, "production_construction_initial_inventory_missing"] };
  initial.gaps.forEach((gap) => gaps.add(gap));
  if (!Number.isSafeInteger(initial.tick) || initial.tick !== capture.startedTick ||
    typeof initial.snapshotRestoreInProgress !== "boolean") failures.push("production_construction_initial_boundary_invalid");
  const ids = new Set<string>();
  for (const entry of initial.sites) {
    const site = entry.site;
    if (!site.actorId || ids.has(site.actorId) || !site.objectName || !site.canonicalObjectName ||
      site.playerNumber !== capture.playerNumber ||
      ![site.active, site.alive, site.finished, site.indexed].every((value) => typeof value === "boolean") ||
      ![ConstructionStateEnum.NotStarted, ConstructionStateEnum.Constructing, ConstructionStateEnum.Paused,
        ConstructionStateEnum.Finished].includes(entry.state) || !Number.isFinite(entry.remainingWorkMs) ||
      site.finished !== (entry.state === ConstructionStateEnum.Finished)) failures.push("production_construction_initial_site_invalid");
    if (site.actorId) ids.add(site.actorId);
    if (!site.indexed || !site.active || !site.alive) gaps.add("production_construction_initial_binding_missing");
  }
  if (initial.sites.length > 256) gaps.add("production_construction_initial_overflow");
  if (initial.snapshotRestoreInProgress) gaps.add("production_construction_initial_restore");
  const unavailable = failures.length || initial.sites.length > 256 ||
    initial.gaps.includes("production_construction_initial_overflow") ||
    initial.gaps.includes("production_construction_initial_reader_missing");
  return { initial: unavailable ? null : initial, failures: [...new Set(failures)], gaps: [...gaps].sort() };
}
