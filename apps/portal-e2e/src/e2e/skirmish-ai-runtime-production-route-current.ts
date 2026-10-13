import { isDeepStrictEqual } from "node:util";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import type { RuntimeProducerRoutesV1 } from "./skirmish-ai-runtime-producer-routes";

/** Awaited owned routes require closed physical and native navigation continuity, never just equal endpoint samples. */
export function runtimeProductionRouteCurrent(
  evidence: {
    readonly coverage: RuntimeProductionEvidenceV2["coverage"];
    readonly lifecycle: Pick<RuntimeProductionEvidenceV2["lifecycle"], "losses">;
  },
  path: RuntimeProducerRoutesV1["paths"][number]
): boolean {
  if (path.currentAtResolution) return true;
  const start = path.requested.spatial,
    end = path.terminal.spatial;
  const history = evidence.coverage;
  if (
    start.kind !== "producer_path" ||
    end.kind !== "producer_path" ||
    !history ||
    history.gaps.length ||
    path.requested.tick >= path.terminal.tick ||
    history.closedThroughTick < path.terminal.tick ||
    start.clockTick !== path.requested.tick ||
    end.clockTick !== path.terminal.tick ||
    !isDeepStrictEqual(start.source, end.source) ||
    !isDeepStrictEqual(start.target, end.target) ||
    !start.source.actorId ||
    !start.target?.actorId ||
    !start.sourceTile ||
    !start.targetTile ||
    !end.sourceTile ||
    !end.targetTile ||
    !start.sourceInCaptureScene ||
    !end.sourceInCaptureScene ||
    !start.targetInCaptureScene ||
    !end.targetInCaptureScene ||
    start.snapshotRestoreInProgress ||
    end.snapshotRestoreInProgress ||
    !start.sceneActive ||
    !end.sceneActive ||
    !isDeepStrictEqual(start.sourceTile, end.sourceTile) ||
    !isDeepStrictEqual(start.targetTile, end.targetTile) ||
    start.source.playerNumber !== start.target.playerNumber ||
    !start.navigation?.native ||
    !end.navigation?.native ||
    !isDeepStrictEqual(start.navigation.native, end.navigation.native)
  )
    return false;
  const identities = [start.source, start.target];
  const intervals = history.intervals.filter(
    (interval) => interval.closedFromTick <= path.terminal.tick && interval.closedThroughTick >= path.requested.tick
  );
  if (
    !intervals.length ||
    (intervals[0]?.closedFromTick ?? Infinity) > path.requested.tick ||
    (intervals.at(-1)?.closedThroughTick ?? -1) < path.terminal.tick ||
    intervals.some(
      (interval, index) =>
        !interval.navigation ||
        interval.navigation.rebuildInProgress ||
        !isDeepStrictEqual(interval.navigation, start.navigation?.native) ||
        (index > 0 && interval.closedFromTick !== (intervals[index - 1]?.closedThroughTick ?? -2) + 1)
    )
  )
    return false;
  for (const [index, identity] of identities.entries()) {
    const first = intervals[0]?.actors.find((actor) => actor.identity.actorId === identity.actorId);
    const tile = index === 0 ? start.sourceTile : start.targetTile;
    if (
      !first?.position ||
      !first.tile ||
      !isDeepStrictEqual(first.tile, tile) ||
      intervals.some((interval) => {
        const actor = interval.actors.find((candidate) => candidate.identity.actorId === identity.actorId);
        return (
          !actor ||
          !actor.identity.alive ||
          !actor.identity.active ||
          !actor.identity.indexed ||
          !actor.identity.finished ||
          actor.identity.playerNumber !== identity.playerNumber ||
          actor.identity.canonicalObjectName !== identity.canonicalObjectName ||
          actor.level !== first.level ||
          !isDeepStrictEqual(actor.position, first.position) ||
          !isDeepStrictEqual(actor.tile, tile)
        );
      }) ||
      evidence.lifecycle.losses.some(
        (loss) =>
          loss.actorId === identity.actorId &&
          loss.sequence > path.requested.sequence &&
          loss.sequence <= path.terminal.sequence
      )
    )
      return false;
  }
  return true;
}
