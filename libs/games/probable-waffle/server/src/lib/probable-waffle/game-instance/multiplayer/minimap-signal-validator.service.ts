import { Injectable, Logger } from "@nestjs/common";
import {
  ProbableWaffleLevels,
  type ProbableWaffleGameInstance,
  type ProbableWaffleMinimapSignalEvent,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { User } from "@supabase/supabase-js";
import { MinimapSignalValidatorServiceInterface } from "./minimap-signal-validator.service.interface";

/**
 * Protects the UI-only signal relay from forged identities, invalid map
 * coordinates, and rapid repeated sends. Signal state stays here instead of in
 * lockstep so it can never influence deterministic gameplay.
 */
@Injectable()
export class MinimapSignalValidatorService extends MinimapSignalValidatorServiceInterface {
  private static readonly MIN_SIGNAL_INTERVAL_MS = 2_000;
  private readonly logger = new Logger(MinimapSignalValidatorService.name);
  private readonly lastSignalAtByGame = new Map<string, Map<number, number>>();

  override validate(event: ProbableWaffleMinimapSignalEvent, gameInstance: ProbableWaffleGameInstance, user: User): boolean {
    const player = gameInstance.getPlayerByNumber(event.playerNumber);
    if (!player || player.playerController.data.userId !== user.id) {
      this.logger.warn(`[MinimapSignal] Ownership violation from user ${user.id} in ${event.gameInstanceId}`);
      return false;
    }

    const definition = player.playerController.data.playerDefinition;
    if (definition?.playerType !== ProbableWafflePlayerType.Human || player.playerController.data.leftOrKilled) {
      return false;
    }

    const mapKey = gameInstance.gameMode?.data.map;
    const map = mapKey ? ProbableWaffleLevels[mapKey] : undefined;
    if (!map || !this.isTileWithinMap(event, map.mapInfo.widthTiles, map.mapInfo.heightTiles)) {
      return false;
    }

    const now = Date.now();
    const lastSignalAt = this.lastSignalAtByGame.get(event.gameInstanceId)?.get(event.playerNumber) ?? 0;
    if (now - lastSignalAt < MinimapSignalValidatorService.MIN_SIGNAL_INTERVAL_MS) {
      return false;
    }

    let gameSignals = this.lastSignalAtByGame.get(event.gameInstanceId);
    if (!gameSignals) {
      gameSignals = new Map();
      this.lastSignalAtByGame.set(event.gameInstanceId, gameSignals);
    }
    gameSignals.set(event.playerNumber, now);
    return true;
  }

  override cleanup(gameInstanceId: string): void {
    this.lastSignalAtByGame.delete(gameInstanceId);
  }

  /** Keeps invalid client numbers from reaching Phaser rendering or teammate sockets. */
  private isTileWithinMap(event: ProbableWaffleMinimapSignalEvent, widthTiles: number, heightTiles: number): boolean {
    const { x, y } = event.tile;
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < widthTiles && y < heightTiles;
  }
}
