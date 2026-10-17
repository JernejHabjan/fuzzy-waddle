import { type GameCommand, type ProbableWaffleGameCommandEvent } from "@fuzzy-waddle/probable-waffle-protocol";
import { type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { SimulationPauseReason } from "../simulation-tick.service";

import { isMultiplayerDebugEnabled } from "./multiplayer-debug";
import { createMultiplayerClientLogger } from "./multiplayer-client-logger";
import { getNgxSocketIoRawSocket } from "../../../core/ngx-socket-io-access";

import { CommandLockstep } from "./command-lockstep";
/** Bounded relay timelines and delayed stall logs; never command admission authority. */
export class CommandRelayDiagnostics {
  constructor(readonly transport: CommandLockstep) {}

  static readonly STALL_LOG_DELAY_MS = 150;

  // Early startup ticks can briefly stall while first heartbeats converge; avoid noisy false alarms.
  static get MIN_TICK_FOR_STALL_WARNING(): number {
    return CommandLockstep.INPUT_DELAY_TICKS + 2;
  }

  readonly debug = isMultiplayerDebugEnabled();

  readonly logger = createMultiplayerClientLogger("CommandBus");

  // Keep a short recent timeline of local tick lifecycle events so stale-heartbeat
  // and stall logs can show how a problematic tick moved through send/echo/commit.
  readonly localTickTimeline = new Map<number, string[]>();

  readonly remoteReceiveTimeline = new Map<PlayerNumber, string[]>();

  readonly lastReceivedRelaySequenceByPlayer = new Map<PlayerNumber, number>();

  stallSignature: string | null = null;

  stallLogTimer: number | null = null;

  pendingStallTick: number | null = null;

  queuedWhileStalledSignature: string | null = null;

  lastLoggedStallTick: number | null = null;

  debugLog(message: string): void {
    if (!this.debug) {
      return;
    }
    this.logger.info(`[CommandBus] ${this.getMultiplayerLogContext()} ${message}`);
  }

  recordLocalTickStage(tick: number, stage: string): void {
    if (!Number.isInteger(tick) || tick < 0) {
      return;
    }
    const stages = this.localTickTimeline.get(tick) ?? [];
    stages.push(stage);
    // Keep the per-tick sequence readable in logs without letting noisy repeats grow forever.
    if (stages.length > 6) {
      stages.shift();
    }
    this.localTickTimeline.set(tick, stages);

    // Keep only a short tail around the latest local send cursor.
    const floorTick = Math.max(0, this.transport.lastSentExecutionTick - 8);
    for (const knownTick of [...this.localTickTimeline.keys()]) {
      if (knownTick < floorTick) {
        this.localTickTimeline.delete(knownTick);
      }
    }
    for (const knownTick of [...this.transport.sentTransportSequenceByTick.keys()]) {
      if (knownTick < floorTick) {
        this.transport.sentTransportSequenceByTick.delete(knownTick);
      }
    }
  }

  describeRecentLocalTickTimeline(): string {
    return [...this.localTickTimeline.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([tick, stages]) => `${tick}:${stages.join(">")}`)
      .join(" | ");
  }

  recordRemoteReceiveStage(playerNumber: PlayerNumber, stage: string): void {
    const stages = this.remoteReceiveTimeline.get(playerNumber) ?? [];
    stages.push(stage);
    if (stages.length > 8) {
      stages.shift();
    }
    this.remoteReceiveTimeline.set(playerNumber, stages);
  }

  describeRemoteReceiveTimeline(): string {
    return [...this.remoteReceiveTimeline.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([playerNumber, stages]) => `${playerNumber}:${stages.join(">")}`)
      .join(" | ");
  }

  observeReceivedCommandEvent(event: ProbableWaffleGameCommandEvent): void {
    const previousReceivedTick = this.transport.lastReceivedTickByPlayer.get(event.playerNumber) ?? 0;
    const previousRelaySequence = this.lastReceivedRelaySequenceByPlayer.get(event.playerNumber) ?? 0;
    const relaySequence = event.transportMeta?.serverRelaySequence;
    const tickOrder =
      event.tick <= previousReceivedTick
        ? "duplicate-or-late"
        : event.tick === previousReceivedTick + 1
          ? "in-order"
          : `gap+${event.tick - previousReceivedTick - 1}`;
    const relayOrder =
      relaySequence === undefined
        ? "no-relay-seq"
        : relaySequence <= previousRelaySequence
          ? "duplicate-or-late"
          : relaySequence === previousRelaySequence + 1
            ? "in-order"
            : `jump+${relaySequence - previousRelaySequence - 1}`;
    const wallLatency =
      event.transportMeta?.serverReceivedAtWallTimeMs !== undefined
        ? Math.max(0, Date.now() - event.transportMeta.serverReceivedAtWallTimeMs)
        : undefined;
    this.recordRemoteReceiveStage(
      event.playerNumber,
      `tick=${event.tick}/${tickOrder},relaySeq=${relaySequence ?? "none"}/${relayOrder},commands=${event.commands.length}`
    );
    if (relaySequence !== undefined) {
      this.lastReceivedRelaySequenceByPlayer.set(event.playerNumber, Math.max(previousRelaySequence, relaySequence));
    }

    if (tickOrder !== "in-order" || relayOrder !== "in-order") {
      this.logger.warn(
        "[CommandBus][RECEIVE-ORDER] " +
          this.getMultiplayerLogContext() +
          " player=" +
          event.playerNumber +
          " tick=" +
          event.tick +
          " tickOrder=" +
          tickOrder +
          " previousReceivedTick=" +
          previousReceivedTick +
          " relaySequence=" +
          (relaySequence ?? "none") +
          " relayOrder=" +
          relayOrder +
          " clientSequence=" +
          (event.transportMeta?.clientSequence ?? "none") +
          " clientObservedTick=" +
          (event.transportMeta?.clientObservedTick ?? "none") +
          " clientAckTick=" +
          (event.transportMeta?.clientAcknowledgedLocalTick ?? "none") +
          " source=" +
          (event.transportMeta?.clientSource ?? "unknown") +
          " wallRelayLatencyMs=" +
          (wallLatency ?? "none") +
          " recentRemoteTicks={" +
          this.describeRemoteReceiveTimeline() +
          "}"
      );
    }
  }

  logStall(nextTick: number): void {
    const committed = this.transport.buffer.getCommittedPlayers(nextTick);
    const missing = this.transport.humanPlayerNumbers.filter((playerNumber) => !committed.includes(playerNumber));
    const pauseReasons = this.transport.tickService?.getPauseReasons().join(",") || "none";
    const signature = `${nextTick}|${committed.join(",")}|${missing.join(",")}`;
    if (signature === this.stallSignature) {
      return;
    }
    this.stallSignature = signature;
    this.lastLoggedStallTick = nextTick;
    this.debugLog(
      "stall nextTick=" +
        nextTick +
        " committed=" +
        (committed.join(",") || "none") +
        " missing=" +
        (missing.join(",") || "none") +
        " pauses=" +
        pauseReasons
    );
    const lastReceivedByPlayer = this.transport.humanPlayerNumbers
      .map((playerNumber) => `${playerNumber}:${this.transport.lastReceivedTickByPlayer.get(playerNumber) ?? "none"}`)
      .join(" ");
    const socketConnected = this.transport.scene?.baseGameData.communicator.activeSocket
      ? (getNgxSocketIoRawSocket(this.transport.scene.baseGameData.communicator.activeSocket)?.connected ?? "unknown")
      : "no-socket";
    const missingReasons = this.describeMissingPlayers(nextTick, missing);
    const localTimeline = this.describeRecentLocalTickTimeline();
    this.logger.warn(
      "[CommandBus][STALL] " +
        this.getMultiplayerLogContext() +
        " nextTick=" +
        nextTick +
        " waitingForPlayers=" +
        (missing.join(",") || "none") +
        " committedBy=" +
        (committed.join(",") || "none") +
        " pauses=" +
        pauseReasons +
        " localPlayer=" +
        (this.transport.localPlayerNumber ?? "none") +
        " lastSentLocalTick=" +
        (this.transport.lastSentTickByLocalPlayer ?? "none") +
        " lastReceivedByPlayer={" +
        lastReceivedByPlayer +
        "} missingReasons={" +
        missingReasons +
        "} recentLocalTicks={" +
        localTimeline +
        "} recentRemoteTicks={" +
        this.describeRemoteReceiveTimeline() +
        "} socketConnected=" +
        socketConnected
    );
  }

  scheduleStallLog(nextTick: number): void {
    if (nextTick < CommandRelayDiagnostics.MIN_TICK_FOR_STALL_WARNING) {
      return;
    }

    if (this.pendingStallTick === nextTick || this.stallSignature?.startsWith(`${nextTick}|`)) {
      return;
    }

    this.clearPendingStallLog();
    this.pendingStallTick = nextTick;
    const missing = this.transport.humanPlayerNumbers.filter(
      (playerNumber) => !this.transport.buffer.getCommittedPlayers(nextTick).includes(playerNumber)
    );
    // A single missing next-tick heartbeat is the common jitter case now. Give
    // that path a slightly longer window before escalating it to a hard stall log.
    const delayMs = this.isOnlyOneTickLag(nextTick, missing) ? 400 : CommandRelayDiagnostics.STALL_LOG_DELAY_MS;
    this.stallLogTimer = window.setTimeout(() => {
      this.stallLogTimer = null;
      this.pendingStallTick = null;
      if (!this.transport.tickService || this.transport.hasAllForTick(nextTick)) {
        return;
      }
      this.logStall(nextTick);
    }, delayMs);
  }

  clearPendingStallLog(): void {
    if (this.stallLogTimer !== null) {
      clearTimeout(this.stallLogTimer);
      this.stallLogTimer = null;
    }
    this.pendingStallTick = null;
  }

  logQueuedWhileStalled(commandType: GameCommand["type"], executeTick: number, playerNumber: PlayerNumber): void {
    if (
      !this.transport.tickService ||
      !this.transport.tickService.getPauseReasons().includes(SimulationPauseReason.Lockstep)
    ) {
      return;
    }

    const blockedTick = this.transport.tickService.currentTick + 1;
    const committed = this.transport.buffer.getCommittedPlayers(blockedTick);
    const missing = this.transport.humanPlayerNumbers.filter(
      (humanPlayerNumber) => !committed.includes(humanPlayerNumber)
    );
    if (missing.length === 0) {
      return;
    }
    // Avoid spamming "queued while stalled" for the expected one-tick-lag case
    // until the stall itself has persisted long enough to earn a real warning.
    if (this.isOnlyOneTickLag(blockedTick, missing) && this.lastLoggedStallTick !== blockedTick) {
      return;
    }

    const signature = `${commandType}|${executeTick}|${blockedTick}|${missing.join(",")}|${committed.join(",")}`;
    if (signature === this.queuedWhileStalledSignature) {
      return;
    }
    this.queuedWhileStalledSignature = signature;
    const missingReasons = this.describeMissingPlayers(blockedTick, missing);
    this.logger.warn(
      "[CommandBus][QUEUE-WHILE-STALLED] " +
        this.getMultiplayerLogContext() +
        " command=" +
        commandType +
        " player=" +
        playerNumber +
        " executeTick=" +
        executeTick +
        " blockedTick=" +
        blockedTick +
        " missingPlayers=" +
        missing.join(",") +
        " committedPlayers=" +
        (committed.join(",") || "none") +
        " missingReasons={" +
        missingReasons +
        "} recentLocalTicks={" +
        this.describeRecentLocalTickTimeline() +
        "} recentRemoteTicks={" +
        this.describeRemoteReceiveTimeline() +
        "}"
    );
  }

  getMultiplayerLogContext(): string {
    const scene = this.transport.scene;
    if (!scene) {
      return "role=unknown isHost=unknown localPlayer=none";
    }

    const role = scene.isHost ? "authoritative-host" : "non-host";
    const metadataData = scene.baseGameData.gameInstance.gameInstanceMetadata.data;
    const hostUserId = metadataData.currentHostUserId ?? metadataData.createdBy ?? "unknown";
    return `role=${role} isHost=${scene.isHost} localPlayer=${this.transport.localPlayerNumber ?? "none"} hostUser=${hostUserId}`;
  }

  /** Documents the describe missing players member and its declared contract at this boundary. */
  describeMissingPlayers(blockedTick: number, missingPlayers: readonly PlayerNumber[]): string {
    if (missingPlayers.length === 0) {
      return "none";
    }

    return missingPlayers
      .map((missingPlayer) => {
        const lastReceived = this.transport.lastReceivedTickByPlayer.get(missingPlayer);
        if (lastReceived === undefined) {
          return `${missingPlayer}:no-batch-received-yet(likely:not-joined-or-no-socket-traffic)`;
        }
        if (lastReceived < blockedTick) {
          const ticksBehind = blockedTick - lastReceived;
          const lagLabel =
            ticksBehind === 1 ? "awaiting-next-commit(one-tick-lag)" : "remote-not-advancing(multi-tick-lag)";
          return `${missingPlayer}:last-received=${lastReceived},missing=${blockedTick},behind=${ticksBehind},cause=${lagLabel}`;
        }
        if (missingPlayer === this.transport.localPlayerNumber) {
          return `${missingPlayer}:last-received=${lastReceived},local-slot-missing-for-${blockedTick}(check-local-send-or-server-echo)`;
        }
        return `${missingPlayer}:last-received=${lastReceived},not-committed-in-buffer-for-${blockedTick}`;
      })
      .join(" ");
  }

  isOnlyOneTickLag(blockedTick: number, missingPlayers: readonly PlayerNumber[]): boolean {
    return (
      missingPlayers.length > 0 &&
      missingPlayers.every(
        (missingPlayer) => this.transport.lastReceivedTickByPlayer.get(missingPlayer) === blockedTick - 1
      )
    );
  }

  describeCommandTypes(commands: readonly GameCommand[]): string {
    return commands.map((command) => command.type).join(",");
  }
}
