import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";

/** Admission flood and legal placement are planner/command facts; actual path resolution and paid work certify use. */
export function runtimeProductionBuilderWork(evidence: RuntimeProductionEvidenceV2, siteId: string) {
  const started = evidence.lifecycle.construction.find(
    (entry) =>
      entry.boundary.construction.site.actorId === siteId &&
      entry.boundary.construction.kind === "lifecycle" &&
      entry.boundary.construction.transition === "started"
  );
  if (!started?.commandScope || !started.placement) return false;
  const commandId = started.commandScope.command.execution?.commandId;
  return evidence.spatial.paths.some(
    (path) =>
      path.constructionPlacement?.sequence === started.placement?.sequence &&
      path.constructionCommand?.command.execution?.commandId === commandId &&
      path.currentAtResolution &&
      path.nativeNavigation.completedRebuildInterval === "same_completed" &&
      path.nativeNavigation.queryGenerationAtTerminal === "same_native_generation" &&
      path.resolved.spatial.kind === "builder_path" &&
      path.resolved.spatial.target.actorId === siteId &&
      path.resolved.spatial.result === "path" &&
      path.resolved.sequence < started.boundary.sequence
  );
}
