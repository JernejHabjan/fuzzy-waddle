import { Subject } from "rxjs";
import type { GameCommand, GameCommandInput } from "../../data/commands/game-command";
import { SimulationTickService } from "./simulation-tick.service";

/**
 * Central command bus for all player- and AI-issued simulation commands.
 *
 * All inputs that affect the deterministic simulation (move, attack, gather,
 * build, stop, etc.) must be dispatched through this bus so that:
 *  1. In single-player, commands are stamped with the current tick and applied immediately.
 *  2. In multiplayer (step 6), the bus stamps commands with currentTick + INPUT_DELAY_TICKS,
 *     relays them over the socket, and only executes them when all peers have confirmed
 *     their commands for that tick (lockstep barrier).
 *
 * Ownership validation (only issue commands for your own actors) is the
 * responsibility of callers, not of receivers. ActionSystem and MovementSystem
 * trust the actorIds in the command and do not re-check ownership.
 */
export class CommandBusService {
  private readonly _command$ = new Subject<GameCommand>();
  readonly command$ = this._command$.asObservable();

  /** Injected after construction once SimulationTickService is registered in the scene. */
  tickService: SimulationTickService | null = null;

  dispatch(command: GameCommandInput): void {
    // Stamp command with the current simulation tick so receivers can order
    // commands deterministically. In single-player currentTick = dispatch tick;
    // in multiplayer (step 6) this becomes currentTick + INPUT_DELAY_TICKS.
    const tick = this.tickService?.currentTick ?? 0;
    const stamped = { ...command, tick } as GameCommand;
    this._command$.next(stamped);
  }

  destroy(): void {
    this._command$.complete();
  }
}
