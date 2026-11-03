import { type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";

import { getCommunicator } from "../../../data/scene-data";

import { CommandLockstep } from "./command-lockstep";

/**
 * Batches commands for one authoritative simulation tick, normalizes ordering, and sends a single transport payload.
 * It preserves lockstep ordering and avoids exposing partially queued local commands as if they were confirmed world mutations.
 */
export function sendCommandBatch(
  transport: CommandLockstep,
  tick: number,
  commands: GameCommand[],
  source: "startup-seed" | "steady-state-tick" | "snapshot-reset"
): void {
  if (!transport.scene || transport.localPlayerNumber === null) return;
  // Use sendToServer() instead of send() so the local buffer is NOT self-committed
  // before server validation. The local player's batch is committed only when the
  // server echoes it back (via on.subscribe below), preventing desync on rejection.
  const commandRelay = getCommunicator(transport.scene).gameCommandChanged;
  if (!commandRelay) {
    return;
  }
  const acknowledgedLocalTick = transport.lastReceivedTickByPlayer.get(transport.localPlayerNumber) ?? -1;
  const existingSequence = transport.sentTransportSequenceByTick.get(tick);
  if (existingSequence !== undefined) {
    // Ordering diagnostics must never become the authority that suppresses a
    // heartbeat. onTick() advances lastSentExecutionTick before we get here,
    // so dropping the send would create a real outbound hole and freeze peers.
    transport.diagnostics.logger.warn(
      "[CommandBus][DUPLICATE-LOCAL-SEND] " +
        transport.diagnostics.getMultiplayerLogContext() +
        " source=" +
        source +
        " tick=" +
        tick +
        " commands=" +
        commands.length +
        " existingClientSequence=" +
        existingSequence +
        " recentLocalTicks={" +
        transport.diagnostics.describeRecentLocalTickTimeline() +
        "}"
    );
  }
  const clientSequence = transport.nextOutboundTransportSequence++;
  transport.sentTransportSequenceByTick.set(tick, clientSequence);
  transport.sentCommandsByTick.set(
    tick,
    commands.map((command) => structuredClone(command))
  );
  while (transport.sentCommandsByTick.size > CommandLockstep.PROCESSED_COMMAND_LIMIT) {
    const oldestTick = transport.sentCommandsByTick.keys().next().value as number | undefined;
    if (oldestTick === undefined) break;
    transport.sentCommandsByTick.delete(oldestTick);
  }
  transport.diagnostics.recordLocalTickStage(
    tick,
    `${source}:${commands.length > 0 ? "send-batch" : "send-heartbeat"}`
  );
  transport.diagnostics.recordLocalTickStage(tick, `client-seq(${clientSequence})`);
  if (tick <= acknowledgedLocalTick) {
    // Older-than-ack sends are the clearest signal that a recovery/startup path
    // emitted a heartbeat after the server had already accepted a newer local tick.
    transport.diagnostics.recordLocalTickStage(tick, `late-vs-ack(${acknowledgedLocalTick})`);
    transport.diagnostics.logger.warn(
      "[CommandBus][LATE-LOCAL-SEND] " +
        transport.diagnostics.getMultiplayerLogContext() +
        " source=" +
        source +
        " tick=" +
        tick +
        " acknowledgedLocalTick=" +
        acknowledgedLocalTick +
        " lastSentExecutionTick=" +
        transport.lastSentExecutionTick +
        " commands=" +
        commands.length +
        " recentLocalTicks={" +
        transport.diagnostics.describeRecentLocalTickTimeline() +
        "}"
    );
  } else {
    transport.diagnostics.debugLog(
      "emit source=" +
        source +
        " tick=" +
        tick +
        " acknowledgedLocalTick=" +
        acknowledgedLocalTick +
        " lastSentExecutionTick=" +
        transport.lastSentExecutionTick +
        " commands=" +
        commands.length
    );
  }

  commandRelay.sendToServer({
    gameInstanceId: transport.scene.gameInstanceId,
    emitterUserId: transport.scene.userId,
    tick,
    playerNumber: transport.localPlayerNumber,
    commands,
    transportMeta: {
      clientSequence,
      clientSentAtWallTimeMs: Date.now(),
      clientObservedTick: transport.tickService?.currentTick ?? 0,
      clientAcknowledgedLocalTick: acknowledgedLocalTick,
      clientSource: source
    }
  });
}
