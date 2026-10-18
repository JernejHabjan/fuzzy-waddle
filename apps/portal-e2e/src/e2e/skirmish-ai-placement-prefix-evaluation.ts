import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import { ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimePlacementClearanceV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-placement-clearance-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Checks static access at every applied shared-build prefix. Actual unit transit/spawn remains a separate obligation. */
export function evaluateRuntimePlacementPrefixes(
  preset: RuntimePresetWorldV1,
  result: Pick<RuntimeVariantResultV1, "productionPreset" | "productionCapture">,
  minimumAppliedPrefixes: number
): string[] {
  const capture = result.productionCapture, application = result.productionPreset;
  if (!capture || !application || capture.startedTick !== 0 || capture.droppedFactCount || capture.droppedSnapshotCount ||
      application.fixtureId !== preset.fixtureId || !Number.isSafeInteger(minimumAppliedPrefixes) || minimumAppliedPrefixes < 1) {
    return ["placement_prefix_capture_or_scope_missing"];
  }
  const declarations = (preset.protectedRoutes ?? []).filter((route) => route.playerNumber === capture.playerNumber);
  if (!declarations.length) return ["placement_prefix_route_declarations_missing"];
  const failures = clearanceFailures(application.placementBaseline, declarations, 0).map((reason) => `baseline:${reason}`);
  let previousSequence = 0, previousTick = 0;
  for (const fact of capture.facts) {
    if (!Number.isSafeInteger(fact.sequence) || fact.sequence <= previousSequence || !Number.isSafeInteger(fact.tick) ||
        fact.tick < previousTick || fact.playerNumber !== capture.playerNumber) {
      return [...failures, "placement_prefix_history_reordered_or_cross_owner"];
    }
    previousSequence = fact.sequence;
    previousTick = fact.tick;
  }
  const placements = capture.facts.filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "placement"
  );
  const delivered = capture.facts.flatMap((fact) => fact.kind === "command_delivered" &&
    fact.command.type === ProbableWaffleGameCommandTypes.Construct ? [fact.command] : []
  );
  const constructionIds = new Set(delivered.map((command) => command.execution?.commandId));
  if (constructionIds.has(undefined)) failures.push("placement_prefix_unstamped_construction");
  const applied = capture.facts.filter((fact) => fact.kind === "outcome" && constructionIds.has(fact.outcome.commandId) &&
    fact.outcome.kind === "applied"
  );
  if (applied.length < minimumAppliedPrefixes) failures.push("placement_prefix_required_builds_missing");
  const commandIds = new Set<string>();
  for (const fact of applied) {
    if (fact.kind !== "outcome") continue;
    const outcome = fact.outcome;
    if (!outcome.commandId || commandIds.has(outcome.commandId) || outcome.worldLinkIds.length !== 1) {
      failures.push("placement_prefix_applied_identity_ambiguous");
      continue;
    }
    commandIds.add(outcome.commandId);
    const matches = placements.filter((candidate) => candidate.spatial.kind === "placement" &&
      candidate.spatial.command.execution?.commandId === outcome.commandId && candidate.sequence < fact.sequence &&
      candidate.tick === fact.tick && candidate.spatial.site.actorId === outcome.worldLinkIds[0]
    );
    const placement = matches[0];
    if (matches.length !== 1 || !placement || placement.spatial.kind !== "placement") {
      failures.push(`placement_prefix_measurement_missing:${outcome.commandId}`);
      continue;
    }
    const spatial = placement.spatial;
    if (!spatial.legal || !spatial.footprint?.length || spatial.gaps.length || !spatial.sceneActive ||
        spatial.snapshotRestoreInProgress || spatial.clockTick !== fact.tick ||
        !spatial.site.active || !spatial.site.alive || !spatial.site.indexed ||
        spatial.site.playerNumber !== capture.playerNumber || spatial.command.playerNumber !== capture.playerNumber ||
        outcome.playerNumber !== capture.playerNumber || outcome.tick !== fact.tick ||
        outcome.authorityEpoch !== spatial.command.execution?.authorityEpoch ||
        outcome.sequence !== spatial.command.execution?.sequence || outcome.commitmentKey !== spatial.command.execution?.commitmentKey) {
      failures.push(`placement_prefix_native_boundary_invalid:${outcome.commandId}`);
    }
    failures.push(...clearanceFailures(spatial.clearance, declarations, fact.tick)
      .map((reason) => `${outcome.commandId}:${reason}`));
  }
  return [...new Set(failures)];
}

function clearanceFailures(
  sample: AiRuntimePlacementClearanceV1 | undefined,
  declarations: NonNullable<RuntimePresetWorldV1["protectedRoutes"]>,
  tick: number
): string[] {
  if (!sample || sample.clockTick !== tick || sample.snapshotRestoreInProgress || !sample.sceneActive || sample.gaps.length) {
    return ["placement_clearance_boundary_missing"];
  }
  const own = sample.routes.filter((route) => declarations.some((entry) => entry.playerNumber === route.declaration.playerNumber));
  if (own.length !== declarations.length) return ["placement_clearance_route_count_mismatch"];
  const failures: string[] = [];
  for (const declaration of declarations) {
    const matches = own.filter((route) => route.declaration.id === declaration.id);
    const route = matches[0], actual = route?.declaration;
    if (matches.length !== 1 || !route || !actual || actual.playerNumber !== declaration.playerNumber ||
        actual.tileMargin !== declaration.tileMargin || actual.from.x !== declaration.from.x || actual.from.y !== declaration.from.y ||
        actual.to.x !== declaration.to.x || actual.to.y !== declaration.to.y) {
      failures.push(`placement_clearance_binding_mismatch:${declaration.id}`);
      continue;
    }
    const path = route.path, first = path?.[0], last = path?.at(-1);
    if (route.gaps.length || route.status !== "path" || !path || path.length < 2 || path.length > 512 ||
        !Number.isSafeInteger(route.visitedTiles) || route.visitedTiles < path.length || route.visitedTiles > 16384 ||
        first?.x !== route.fromTile.x || first?.y !== route.fromTile.y || last?.x !== route.toTile.x || last?.y !== route.toTile.y ||
        path.some((point, index) => {
          const previous = path[index - 1];
          return !Number.isSafeInteger(point.x) || !Number.isSafeInteger(point.y) || point.x < 0 || point.y < 0 ||
            (!!previous && (Math.abs(previous.x - point.x) > 1 || Math.abs(previous.y - point.y) > 1 ||
              (previous.x === point.x && previous.y === point.y)));
        })) failures.push(`placement_clearance_route_blocked_or_unproved:${declaration.id}`);
  }
  return failures;
}
