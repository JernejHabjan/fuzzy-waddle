import { ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";

/**
 * A stamped shared Move must reach its original endpoint physically.
 * Receipts, true returns and fallback arrivals are insufficient.
 */
export function runtimeControlTransitFailures(
  capture: AiRuntimeProductionCaptureV1, controlId: string, latestTick: number, expected: "arrive" | "blocked"
): string[] {
  const controls = capture.facts.filter((fact) => fact.kind === "preset_control" && fact.control.id === controlId &&
    fact.control.phase === "applied"
  );
  const control = controls[0];
  if (controls.length !== 1 || control?.kind !== "preset_control") {
    return [`native_transit_control_missing:${controlId}`];
  }
  const command = control.control.command, actorId = control.control.actorId;
  if (command?.type !== ProbableWaffleGameCommandTypes.Move || !command.execution) {
    return [`native_transit_control_missing:${controlId}`];
  }
  const requests = capture.facts.filter((fact) => fact.kind === "preset_control" && fact.control.id === controlId &&
    fact.control.phase === "requested"
  );
  const request = requests[0];
  if (requests.length !== 1 || request?.kind !== "preset_control" || request.sequence >= control.sequence ||
      request.control.actorId !== actorId || request.control.playerNumber !== capture.playerNumber ||
      request.tick !== control.control.requestedTick || control.tick !== control.control.scheduledTick ||
      command.tick !== control.tick) return [`native_transit_request_boundary_invalid:${controlId}`];
  if (command.playerNumber !== capture.playerNumber || command.actorIds.length !== 1 || command.actorIds[0] !== actorId ||
      command.execution?.source !== "human" || !control.control.outcomes.some((outcome) =>
        outcome.commandId === command.execution?.commandId && (
          outcome.reason === "applied" && ["applied", "active", "completed"].includes(outcome.kind) ||
          outcome.kind === "dispatched" && outcome.reason === "accepted_for_dispatch"
        )
      ) || control.control.outcomes.some((outcome) => ["failed", "rejected"].includes(outcome.kind))) {
    return [`native_transit_control_not_applied:${controlId}`];
  }
  const normalized = normalizeRuntimeMovement(capture);
  if (normalized.failures.length) return [`native_transit_capture_invalid:${controlId}`];
  const attempts = normalized.movements.filter((movement) => {
    const start = movement.observations[0];
    // Shared application can begin synchronously before dispatchDeterministic returns its receipt.
    return start?.spatial.source.actorId === actorId && start.sequence > request.sequence &&
      start.tick >= control.tick && start.tick <= latestTick &&
      start.spatial.caller?.order?.commandContext?.execution.commandId === command.execution?.commandId;
  });
  const arrived = attempts.some((movement) => movement.callerAttributed && !movement.gaps.length &&
    movement.arrival === "original_destination" && movement.returned === "true" && movement.observations.some((entry) =>
      entry.spatial.phase === "arrived" && entry.tick <= latestTick &&
      entry.spatial.actualTile?.x === command.tileVec3.x && entry.spatial.actualTile?.y === command.tileVec3.y
    )
  );
  if (expected === "arrive") return arrived ? [] : [`native_transit_original_endpoint_missing:${controlId}`];
  const touchedTarget = attempts.some((movement) => movement.observations.some((entry) =>
    entry.spatial.actualTile?.x === command.tileVec3.x && entry.spatial.actualTile?.y === command.tileVec3.y
  ));
  const terminated = attempts.some((movement) => movement.callerAttributed &&
    (movement.returned === "false" || movement.returned === "true") &&
    movement.observations.at(-1)?.tick !== undefined && (movement.observations.at(-1)?.tick ?? Infinity) <= latestTick
  );
  return !arrived && !touchedTarget && terminated ? [] : [`native_transit_blocked_control_unproved:${controlId}`];
}
