import { Scene } from "phaser";
import { CreateSceneFromObjectConfig } from "./scene-config.interface";
import { EventEmitter } from "@angular/core";
import { UpdateEventData } from "./update-event-data";
import { BaseGame } from "../game/base-game";
import { BaseGameData } from "../game/base-game-data";
import { Subscription } from "rxjs";
import {
  BaseData,
  BaseGameMode,
  BaseGameState,
  BasePlayer,
  BaseSpectator,
  BaseSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { Loader } from "../../../../little-muncher/game/loader";
import { LittleMuncherCommunicatorService } from "../../../../little-muncher/main/communicators/little-muncher-communicator.service";

export class BaseScene<
    TGameData extends BaseGameData = BaseGameData,
    TGameStateData extends BaseData = BaseData,
    TGameState extends BaseGameState<TGameStateData> = BaseGameState<TGameStateData>,
    TGameModeData extends BaseData = BaseData,
    TGameMode extends BaseGameMode<TGameModeData> = BaseGameMode<TGameModeData>,
    TPlayerStateData extends BaseData = BaseData,
    TPlayerControllerData extends BaseData = BaseData,
    TPlayer extends BasePlayer<TPlayerStateData, TPlayerControllerData> = BasePlayer<
      TPlayerStateData,
      TPlayerControllerData
    >,
    TSpectatorData extends BaseSpectatorData = BaseSpectatorData,
    TSpectator extends BaseSpectator<TSpectatorData> = BaseSpectator<TSpectatorData>
  >
  extends Scene
  implements CreateSceneFromObjectConfig
{
  onInit: EventEmitter<void> = new EventEmitter<void>();
  onPreload: EventEmitter<void> = new EventEmitter<void>();
  onCreate: EventEmitter<void> = new EventEmitter<void>();
  postCreate: EventEmitter<void> = new EventEmitter<void>();
  onDestroy: EventEmitter<void> = new EventEmitter<void>();
  onUpdate: EventEmitter<UpdateEventData> = new EventEmitter<UpdateEventData>();
  onResize: EventEmitter<void> = new EventEmitter<void>();

  private subscriptions: Subscription[] = [];

  override game!: BaseGame<TGameData>;
  communicator!: LittleMuncherCommunicatorService;
  baseGameData!: TGameData;

  preload() {
    new Loader(this);
    this.onPreload.emit();
  }

  init() {
    this.game = this.sys.game as BaseGame<TGameData>;
    this.baseGameData = this.game.data;
    this.communicator = this.baseGameData.communicator;
    this.registerSceneDestroy();
    this.registerSceneResize();
    this.registerScenePostCreate();
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

  private registerScenePostCreate() {
    this.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.postCreate.emit();
    });
  }

  private registerSceneDestroy() {
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }

  subscribe(subscription?: Subscription) {
    if (!subscription) return;
    this.subscriptions.push(subscription);
  }

  destroy() {
    this.scale.removeAllListeners();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.onDestroy.emit();
  }

  get gameState(): TGameState {
    if (!this.baseGameData.gameInstance.gameState) throw new Error("GameState is not defined");
    return this.baseGameData.gameInstance.gameState as TGameState;
  }

  get gameMode(): TGameMode {
    if (!this.baseGameData.gameInstance.gameMode) throw new Error("GameMode is not defined");
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
    if (!player) throw new Error("Player is not defined");
    return player as TPlayer;
  }

  get spectatorOrNull(): TSpectator | null {
    const spectator = this.baseGameData.gameInstance.spectators.find(
      (spectator) => spectator.data.userId === this.baseGameData.user.userId
    );
    if (!spectator) return null;
    return spectator as TSpectator;
  }

  get spectator(): TSpectator {
    const spectator = this.spectatorOrNull;
    if (!spectator) throw new Error("Spectator is not defined");
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
