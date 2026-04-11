import { Subject } from "rxjs";
import type { GameCommand } from "../../data/commands/game-command";

/**
 * Central command bus for all player- and AI-issued simulation commands.
 *
 * All inputs that affect the deterministic simulation (move, attack, gather,
 * build, stop, etc.) must be dispatched through this bus so that:
 *  1. In single-player, commands are applied immediately in the local tick.
 *  2. In multiplayer, the bus is the interception point where commands are
 *     stamped with a future tick number and relayed over the socket before
 *     execution (added in the network relay step).
 *
 * Ownership validation (only issue commands for your own actors) is the
 * responsibility of callers, not of receivers. ActionSystem and MovementSystem
 * trust the actorIds in the command and do not re-check ownership.
 */
export class CommandBusService {
  private readonly _command$ = new Subject<GameCommand>();
  readonly command$ = this._command$.asObservable();

  dispatch(command: GameCommand): void {
    this._command$.next(command);
  }

  destroy(): void {
    this._command$.complete();
  }
}
