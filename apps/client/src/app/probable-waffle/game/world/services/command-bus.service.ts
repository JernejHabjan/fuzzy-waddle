import { Subject, Subscription } from "rxjs";
import type { GameCommand, GameCommandInput } from "../../data/commands/game-command";
import { SimulationTickService } from "./simulation-tick.service";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { CommandBuffer } from "./command-buffer";
import { getCommunicator } from "../../data/scene-data";
import { ProbableWafflePlayerType, type PlayerNumber } from "@fuzzy-waddle/api-interfaces";

/**
 * Central command bus for all player- and AI-issued simulation commands.
 *
 * Single-player path: commands are stamped with the current tick and emitted
 * immediately on command$. No buffering or network I/O.
 *
 * Multiplayer path (activated by initMultiplayer()):
 *   1. dispatch() stamps the command for currentTick + INPUT_DELAY_TICKS (2),
 *      queues it in pendingOutbound, and does NOT emit yet.
 *   2. On each tick T, the bus sends pendingOutbound[T+2] over the socket
 *      (even if empty — this is the per-tick heartbeat peers need to advance).
 *   3. Incoming remote batches are buffered by (tick, playerNumber).
 *   4. Before advancing to tick T+1 the bus checks that all human players have
 *      committed for T+1. If not, SimulationTickService is stalled.
 *   5. Commands for the current tick are flushed to command$ in playerNumber
 *      order so every client applies them identically.
 *
 * Ownership validation (only issue commands for your own actors) is the
 * responsibility of callers. ActionSystem and MovementSystem trust the actorIds.
 */
export class CommandBusService {
  /** 2-tick delay = 100 ms window for commands to reach all peers before execution. */
  static readonly INPUT_DELAY_TICKS = 2;

  private readonly _command$ = new Subject<GameCommand>();
  readonly command$ = this._command$.asObservable();

  /** Injected after construction once SimulationTickService is registered. */
  tickService: SimulationTickService | null = null;

  private isMultiplayer = false;
  private humanPlayerNumbers: PlayerNumber[] = [];
  private localPlayerNumber: PlayerNumber | null = null;

  /** Outbound commands indexed by execution tick (currentTick + INPUT_DELAY). */
  private pendingOutbound = new Map<number, GameCommand[]>();
  private readonly buffer = new CommandBuffer();
  private readonly subscriptions: Subscription[] = [];
  private scene: ProbableWaffleScene | null = null;

  /**
   * Activates the multiplayer relay path.
   * Must be called after tickService is set and the communicator is ready.
   * Safe to call only in sessions where gameCommandChanged is defined.
   */
  initMultiplayer(scene: ProbableWaffleScene): void {
    this.scene = scene;
    this.isMultiplayer = true;
    this.localPlayerNumber = scene.baseGameData.user.playerNumber ?? null;
    this.humanPlayerNumbers = scene.baseGameData.gameInstance.players
      .filter((p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human)
      .map((p) => p.playerNumber!);

    const communicator = getCommunicator(scene);

    // Receive remote command batches and buffer them
    this.subscriptions.push(
      communicator.gameCommandChanged!.on.subscribe((event) => {
        this.buffer.commit(event.tick, event.playerNumber, event.commands as GameCommand[]);
        this.tryUnblockTick();
      })
    );

    // On every tick: flush commands, send outbound batch, gate next tick
    if (this.tickService) {
      this.subscriptions.push(this.tickService.tick$.subscribe((tick) => this.onTick(tick)));
    }
  }

  dispatch(command: GameCommandInput): void {
    if (this.scene?.isSpectator) {
      return;
    }

    if (!this.isMultiplayer) {
      // Single-player: stamp and emit immediately
      const tick = this.tickService?.currentTick ?? 0;
      this._command$.next({ ...command, tick } as GameCommand);
      return;
    }

    // Multiplayer: stamp with delay, queue for outbound
    const tick = (this.tickService?.currentTick ?? 0) + CommandBusService.INPUT_DELAY_TICKS;
    const stamped = { ...command, tick } as GameCommand;
    if (!this.pendingOutbound.has(tick)) {
      this.pendingOutbound.set(tick, []);
    }
    this.pendingOutbound.get(tick)!.push(stamped);
  }

  private onTick(tick: number): void {
    // 1. Flush commands committed for this tick to command$ (in playerNumber order)
    const commands = this.buffer.flush(tick);
    for (const cmd of commands) {
      this._command$.next(cmd);
    }

    // 2. Commit our own commands for the future tick and send them to peers
    //    (even if empty — this is the lockstep heartbeat)
    const futureTick = tick + CommandBusService.INPUT_DELAY_TICKS;
    const outbound = this.pendingOutbound.get(futureTick) ?? [];
    this.pendingOutbound.delete(futureTick);
    if (this.localPlayerNumber !== null) {
      // Buffer our own commands locally so hasAll() counts us
      this.buffer.commit(futureTick, this.localPlayerNumber, outbound);
      this.sendCommandBatch(futureTick, outbound);
    }

    // 3. Gate the next tick: stall until all peers have committed for tick+1
    if (this.tickService && !this.hasAllForTick(tick + 1)) {
      this.tickService.pauseTick();
    }

    this.buffer.gc(tick);
  }

  private sendCommandBatch(tick: number, commands: GameCommand[]): void {
    if (!this.scene || this.localPlayerNumber === null) return;
    getCommunicator(this.scene).gameCommandChanged!.send({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      tick,
      playerNumber: this.localPlayerNumber,
      commands
    });
  }

  /** Unblocks the tick if the next tick's commands have now arrived. */
  private tryUnblockTick(): void {
    if (!this.tickService) return;
    const nextTick = this.tickService.currentTick + 1;
    if (this.hasAllForTick(nextTick)) {
      this.tickService.resumeTick();
    }
  }

  private hasAllForTick(tick: number): boolean {
    return this.buffer.hasAll(tick, this.humanPlayerNumbers);
  }

  destroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this._command$.complete();
  }
}

