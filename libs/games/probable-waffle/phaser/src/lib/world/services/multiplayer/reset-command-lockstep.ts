import type { GameCommandAuthorityState, ProbableWaffleReplayCommandBatch } from "@fuzzy-waddle/probable-waffle-protocol";
import { CommandLockstep } from "./command-lockstep";
import { sendCommandBatch } from "./send-command-batch";

/** Restore the authoritative tail and retain unsent local input without claiming application before the server echo. */
export function resetCommandLockstep(
  transport: CommandLockstep, snapshotTick: number,
  commandTail: readonly ProbableWaffleReplayCommandBatch[], authorityState?: GameCommandAuthorityState
): void {
  // Preserve only locally unsent input. Server-accepted input belongs to the authoritative response tail.
  const unsent = [...transport.pendingOutbound.values()].flat().filter((command) => {
    const execution = command.execution;
    if (!execution) return false;
    if (authorityState && execution.authorityEpoch !== authorityState.authorityEpoch) return false;
    return !authorityState?.processedCommandIds.includes(execution.commandId) &&
      execution.sequence > (authorityState?.processedSequenceWatermarkByPlayer?.[command.playerNumber] ?? -1) &&
      !commandTail.some((batch) => batch.commands.some((entry) => entry.execution?.commandId === execution.commandId));
  });
  const preResetLastSentExecutionTick = transport.lastSentExecutionTick;
  const commandTailLookup = new Set(commandTail.map((batch) => `${batch.tick}:${batch.playerNumber}`));
  transport.buffer.clear();
  transport.pendingOutbound.clear();
  transport.sentTransportSequenceByTick.clear();
  transport.sentCommandsByTick.clear();
  transport.diagnostics.clearPendingStallLog();
  transport.diagnostics.stallSignature = null;
  transport.diagnostics.lastLoggedStallTick = null;
  if (authorityState) transport.restoreAuthority(authorityState);
  // Snapshot tick can lag behind the server's already-accepted local batches.
  // If we blindly restart from snapshotTick+1 we can spam stale ticks after correction.
  // Use the highest known accepted local tick as the post-reset baseline.
  const acceptedLocalTick =
    transport.localPlayerNumber !== null
      ? (transport.lastReceivedTickByPlayer.get(transport.localPlayerNumber) ?? snapshotTick)
      : snapshotTick;
  const localTailTick =
    transport.localPlayerNumber !== null
      ? commandTail
          .filter((batch) => batch.playerNumber === transport.localPlayerNumber)
          .reduce((maxTick, batch) => Math.max(maxTick, batch.tick), snapshotTick)
      : snapshotTick;
  // Snapshot correction can land after the steady-state sender already emitted
  // one or more future heartbeats. Keep that pre-reset frontier in the baseline
  // so recovery does not re-seed ticks the live sender already claimed.
  const resetBaselineTick = Math.max(snapshotTick, acceptedLocalTick, localTailTick, preResetLastSentExecutionTick);
  if (preResetLastSentExecutionTick > Math.max(snapshotTick, acceptedLocalTick, localTailTick)) {
    transport.diagnostics.logger.warn(
      "[CommandBus][SNAPSHOT-RESET-CLAMP] " +
        transport.diagnostics.getMultiplayerLogContext() +
        " snapshotTick=" +
        snapshotTick +
        " acceptedLocalTick=" +
        acceptedLocalTick +
        " localTailTick=" +
        localTailTick +
        " preResetLastSentTick=" +
        preResetLastSentExecutionTick +
        " resetBaselineTick=" +
        resetBaselineTick
    );
  }
  transport.lastSentExecutionTick = resetBaselineTick;
  // Re-time delivery, never restamp identity or charge/effect. Seed heartbeats precede this fresh unsent slot.
  if (unsent.length) {
    const tick = resetBaselineTick + CommandLockstep.INPUT_DELAY_TICKS + 1;
    transport.pendingOutbound.set(tick, unsent.map((command) => ({ ...command, tick })));
  }

  const restoredAcceptedSlots: string[] = [];
  for (const playerNumber of transport.humanPlayerNumbers) {
    const acceptedTick = transport.lastReceivedTickByPlayer.get(playerNumber) ?? snapshotTick;
    for (let tick = snapshotTick + 1; tick <= acceptedTick; tick++) {
      if (commandTailLookup.has(`${tick}:${playerNumber}`)) {
        continue;
      }
      // Snapshot replay tails can omit empty heartbeats even though lockstep had
      // already accepted them before the reset. Re-materialize those accepted
      // empty slots here so recovery cannot strand an old tick behind a sparse tail.
      transport.buffer.commit(tick, playerNumber, []);
      if (playerNumber === transport.localPlayerNumber) {
        transport.diagnostics.recordLocalTickStage(tick, "snapshot-ack-backfill");
      }
      restoredAcceptedSlots.push(`${playerNumber}:${tick}`);
    }
  }
  if (restoredAcceptedSlots.length > 0) {
    transport.diagnostics.logger.warn(
      "[CommandBus][SNAPSHOT-ACK-BACKFILL] " +
        transport.diagnostics.getMultiplayerLogContext() +
        " snapshotTick=" +
        snapshotTick +
        " restored=" +
        restoredAcceptedSlots.join(",")
    );
  }

  if (transport.localPlayerNumber !== null) {
    for (let tick = resetBaselineTick + 1; tick <= resetBaselineTick + CommandLockstep.INPUT_DELAY_TICKS; tick++) {
      // Same as seedInitialTicks: directly commit here so the barrier doesn't
      // stall before the server echo arrives.  Re-commit on echo is harmless.
      transport.buffer.commit(tick, transport.localPlayerNumber, []);
      transport.diagnostics.recordLocalTickStage(tick, "snapshot-local-commit");
      transport.lastSentExecutionTick = Math.max(transport.lastSentExecutionTick, tick);
      sendCommandBatch(transport, tick, [], "snapshot-reset");
    }
  }

  for (const batch of [...commandTail].sort((a, b) => a.tick - b.tick || a.playerNumber - b.playerNumber)) {
    transport.buffer.commit(batch.tick, batch.playerNumber, batch.commands);
  }

  transport.tryUnblockTick();
}
