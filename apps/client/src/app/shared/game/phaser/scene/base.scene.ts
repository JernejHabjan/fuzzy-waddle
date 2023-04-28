import { Scene } from 'phaser';
import { CreateSceneFromObjectConfig } from './scene-config.interface';
import { EventEmitter } from '@angular/core';
import { UpdateEventData } from './update-event-data';
import { BaseGame } from '../game/base-game';
import { BaseGameData } from '../game/base-game-data';
import { Subscription } from 'rxjs';
import { GameModeBase, GameSessionInstance } from '@fuzzy-waddle/api-interfaces';

export default class BaseScene<
    TGameMode extends GameModeBase = GameModeBase,
    TGameData extends BaseGameData<TGameMode> = BaseGameData<TGameMode>
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

  override game!: BaseGame<TGameMode, TGameData>;
  protected baseGameData!: TGameData;
  protected gameSessionInstance!: GameSessionInstance<TGameMode>;

  preload() {
    this.onPreload.emit();
  }

  init() {
    this.game = this.sys.game as BaseGame<TGameMode, TGameData>;
    this.baseGameData = this.game.data;
    this.gameSessionInstance = this.baseGameData.gameSessionInstance;
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
}
