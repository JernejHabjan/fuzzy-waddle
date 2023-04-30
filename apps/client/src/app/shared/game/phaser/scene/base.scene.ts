import { Scene } from 'phaser';
import { CreateSceneFromObjectConfig } from './scene-config.interface';
import { EventEmitter } from '@angular/core';
import { UpdateEventData } from './update-event-data';
import { BaseGame } from '../game/base-game';
import { BaseGameData } from '../game/base-game-data';
import { Subscription } from 'rxjs';
import { BaseGameMode, BaseGameState, BasePlayer, BaseSpectator } from '@fuzzy-waddle/api-interfaces';
import { CommunicatorService } from '../../../../little-muncher/game/communicator.service';

export default class BaseScene<
    TGameData extends BaseGameData = BaseGameData,
    TGameState extends BaseGameState = BaseGameState,
    TGameMode extends BaseGameMode = BaseGameMode,
    TPlayer extends BasePlayer = BasePlayer,
    TSpectator extends BaseSpectator = BaseSpectator
  >
  extends Scene
  implements CreateSceneFromObjectConfig
{
  onInit: EventEmitter<void> = new EventEmitter<void>();
  onPreload: EventEmitter<void> = new EventEmitter<void>();
  onCreate: EventEmitter<void> = new EventEmitter<void>();
  onDestroy: EventEmitter<void> = new EventEmitter<void>();
  onUpdate: EventEmitter<UpdateEventData> = new EventEmitter<UpdateEventData>();
  onResize: EventEmitter<void> = new EventEmitter<void>();

  private subscriptions: Subscription[] = [];

  override game!: BaseGame<TGameData>;
  protected communicator!: CommunicatorService;
  protected baseGameData!: TGameData;

  preload() {
    this.onPreload.emit();
  }

  init() {
    this.game = this.sys.game as BaseGame<TGameData>;
    this.baseGameData = this.game.data;
    this.communicator = this.baseGameData.communicator;
    this.registerSceneDestroy();
    this.registerSceneResize();
    this.onInit.emit();
  }

  create() {
    this.onCreate.emit();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.onUpdate.emit({ time, delta });
  }

  private registerSceneResize() {
    this.scale.on(Phaser.Scale.Events.RESIZE, () => {
      this.onResize.emit();
    });
  }

  private registerSceneDestroy() {
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }

  protected subscribe(subscription?: Subscription) {
    if (!subscription) return;
    this.subscriptions.push(subscription);
  }

  destroy() {
    this.scale.removeAllListeners();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.onDestroy.emit();
  }

  get gameState(): TGameState {
    if (!this.baseGameData.gameInstance.gameState) throw new Error('GameState is not defined');
    return this.baseGameData.gameInstance.gameState as TGameState;
  }

  get gameMode(): TGameMode {
    if (!this.baseGameData.gameInstance.gameMode) throw new Error('GameMode is not defined');
    return this.baseGameData.gameInstance.gameMode as TGameMode;
  }

  get playerOrNull(): TPlayer | null {
    const player = this.baseGameData.gameInstance.players.find(
      (player) => player.userId === this.baseGameData.user.userId
    );
    if (!player) return null;
    return player as TPlayer;
  }

  get player(): TPlayer {
    const player = this.playerOrNull;
    if (!player) throw new Error('Player is not defined');
    return player as TPlayer;
  }

  get spectatorOrNull(): TSpectator | null {
    const spectator = this.baseGameData.gameInstance.spectators.find(
      (spectator) => spectator.userId === this.baseGameData.user.userId
    );
    if (!spectator) return null;
    return spectator as TSpectator;
  }

  get spectator(): TSpectator {
    const spectator = this.spectatorOrNull;
    if (!spectator) throw new Error('Spectator is not defined');
    return spectator as TSpectator;
  }

  get isHost(): boolean {
    return this.baseGameData.gameInstance.isHost(this.baseGameData.user.userId);
  }

  get isPlayer(): boolean {
    return this.baseGameData.gameInstance.isPlayer(this.baseGameData.user.userId);
  }

  get isSpectator(): boolean {
    return this.baseGameData.gameInstance.isSpectator(this.baseGameData.user.userId);
  }
}
