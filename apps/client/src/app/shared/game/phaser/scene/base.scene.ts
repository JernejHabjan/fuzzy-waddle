import { Scene } from "phaser";
import { CreateSceneFromObjectConfig } from "./scene-config.interface";
import { EventEmitter } from "@angular/core";
import { UpdateEventData } from "./update-event-data";
import { BaseGame } from "../game/base-game";
import { BaseGameData } from "../game/base-game-data";
import { Observable, Subscription, take } from "rxjs";
import {
  BaseData,
  BaseGameMode,
  BaseGameState,
  BasePlayer,
  BasePlayerControllerData,
  BaseSpectator,
  BaseSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { Loader } from "../../../../little-muncher/game/loader";
import { CommunicatorService } from "../../communicators/CommunicatorService";

export const SceneGameDataKey = "SceneGameData";
export class BaseScene<
    TGameData extends BaseGameData = BaseGameData,
    TGameStateData extends BaseData = BaseData,
    TGameState extends BaseGameState<TGameStateData> = BaseGameState<TGameStateData>,
    TGameModeData extends BaseData = BaseData,
    TGameMode extends BaseGameMode<TGameModeData> = BaseGameMode<TGameModeData>,
    TPlayerStateData extends BaseData = BaseData,
    TPlayerControllerData extends BasePlayerControllerData = BasePlayerControllerData,
    TPlayer extends BasePlayer<TPlayerStateData, TPlayerControllerData> = BasePlayer<
      TPlayerStateData,
      TPlayerControllerData
    >,
    TSpectatorData extends BaseSpectatorData = BaseSpectatorData,
    TSpectator extends BaseSpectator<TSpectatorData> = BaseSpectator<TSpectatorData>,
    TCommunicatorService extends CommunicatorService = CommunicatorService
  >
  extends Scene
  implements CreateSceneFromObjectConfig
{
  _onInit: EventEmitter<void> = new EventEmitter<void>();
  _onPreload: EventEmitter<void> = new EventEmitter<void>();
  _onCreate: EventEmitter<void> = new EventEmitter<void>();
  _postCreate: EventEmitter<void> = new EventEmitter<void>();
  _onShutdown: EventEmitter<void> = new EventEmitter<void>();
  _onDestroy: EventEmitter<void> = new EventEmitter<void>();
  onUpdate: EventEmitter<UpdateEventData> = new EventEmitter<UpdateEventData>();
  onResize: EventEmitter<void> = new EventEmitter<void>();

  private subscriptions: Subscription[] = [];

  override game!: BaseGame<TGameData>;
  communicator!: TCommunicatorService;
  baseGameData!: TGameData;

  get onInit(): Observable<void> {
    return this._onInit.pipe(take(1));
  }

  get onPreload(): Observable<void> {
    return this._onPreload.pipe(take(1));
  }

  get onCreate(): Observable<void> {
    return this._onCreate.pipe(take(1));
  }

  get onPostCreate(): Observable<void> {
    return this._postCreate.pipe(take(1));
  }

  /**
   * NOTE! - use {@link onShutdown} instead as that is handled on scene restart
   */
  get onDestroy(): Observable<void> {
    return this._onDestroy.pipe(take(1));
  }

  get onShutdown(): Observable<void> {
    return this._onShutdown;
  }

  preload() {
    new Loader(this);
    this._onPreload.emit();
  }

  init() {
    this.game = this.sys.game as BaseGame<TGameData>;
    this.baseGameData = this.game.data;
    this.communicator = this.baseGameData.communicator as TCommunicatorService;

    this.data.set(SceneGameDataKey, this.getSceneGameData());

    this.registerSceneDestroy();
    this.registerSceneShutdown();
    this.registerSceneResize();
    this.registerScenePostCreate();
    this._onInit.emit();
  }

  protected getSceneGameData() {
    return {
      baseGameData: this.baseGameData
    };
  }

  create() {
    this._onCreate.emit();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.onUpdate.emit({ time, delta });
  }

  private registerSceneResize() {
    this.scale.on(Phaser.Scale.Events.RESIZE, this.sceneResize, this);
  }

  private sceneResize() {
    this.onResize.emit();
  }

  private registerScenePostCreate() {
    this.events.once(Phaser.Scenes.Events.CREATE, () => {
      this._postCreate.emit();
      this.postCreate();
    });
  }

  private registerSceneDestroy() {
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }

  private registerSceneShutdown() {
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this._sceneShutdown, this);
  }

  private _sceneShutdown() {
    this.cleanupBaseScene();
    this._onShutdown.emit();
    this.shutDown();
  }

  /**
   * on scene restart for example
   */
  protected shutDown(): void {}

  subscribe(subscription?: Subscription) {
    if (!subscription) return;
    this.subscriptions.push(subscription);
  }

  private cleanupBaseScene() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  destroy() {
    this.scale.removeAllListeners();
    this.cleanupBaseScene();
    this._onDestroy.emit();
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this._sceneShutdown, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.sceneResize, this);
  }

  protected postCreate(): void {}

  get gameState(): TGameState {
    if (!this.baseGameData.gameInstance.gameState) throw new Error("GameState is not defined");
    return this.baseGameData.gameInstance.gameState as TGameState;
  }

  get gameMode(): TGameMode {
    if (!this.baseGameData.gameInstance.gameMode) throw new Error("GameMode is not defined");
    return this.baseGameData.gameInstance.gameMode as TGameMode;
  }

  get players(): TPlayer[] {
    return this.baseGameData.gameInstance.players as TPlayer[];
  }

  get playerOrNull(): TPlayer | null {
    const player = this.baseGameData.gameInstance.players.find(
      (player) => player.playerController.data.userId === this.baseGameData.user.userId
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

  get gameInstanceId(): string {
    return this.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!;
  }

  get userId(): string | null {
    return this.baseGameData.user.userId;
  }
}

export function getBaseGameDataFromScene<TGameData extends BaseGameData>(scene: Phaser.Scene): TGameData {
  if (!(scene instanceof BaseScene)) throw new Error("Scene is not an instance of BaseScene");
  const baseGameData = scene.baseGameData;
  if (!baseGameData) throw new Error("BaseGameData is not defined in scene");
  return baseGameData as TGameData;
}

export function getGameModeFromScene<TGameMode extends BaseGameMode>(scene: Phaser.Scene): TGameMode {
  const baseGameData = getBaseGameDataFromScene<BaseGameData>(scene);
  const gameMode = baseGameData.gameInstance.gameMode;
  if (!gameMode) throw new Error("GameMode is not defined in scene");
  if (!(gameMode instanceof BaseGameMode)) throw new Error("GameMode is not an instance of BaseGameMode");
  return gameMode as TGameMode;
}

export function getPlayersFromScene<TPlayer extends BasePlayer>(scene: Phaser.Scene): TPlayer[] {
  const baseGameData = getBaseGameDataFromScene<BaseGameData>(scene);
  const players = baseGameData.gameInstance.players;
  if (!players) throw new Error("Players are not defined in scene");
  if (!Array.isArray(players)) throw new Error("Players is not an array");
  return players as TPlayer[];
}

export function isPlayerHostInScene<TPlayer extends BasePlayer>(scene: Phaser.Scene, player: TPlayer): boolean {
  const baseGameData = getBaseGameDataFromScene<BaseGameData>(scene);
  return baseGameData.gameInstance.isHost(player.playerController.data.userId);
}
