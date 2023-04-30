import { Scenes } from './const/scenes';
import {
  LittleMuncherGameMode,
  LittleMuncherGameModeData,
  LittleMuncherGameState,
  LittleMuncherGameStateData,
  LittleMuncherPlayer,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerStateData,
  LittleMuncherSpectator,
  LittleMuncherSpectatorData
} from '@fuzzy-waddle/api-interfaces';
import BaseScene from '../../shared/game/phaser/scene/base.scene';
import { Fireworks } from '../../shared/game/phaser/components/fireworks';
import { LittleMuncherGameData } from './little-muncher-game-data';
import { Pause } from './pause';
import { PlayerInputController } from './player-input-controller';

export default class LittleMuncherScene extends BaseScene<
  LittleMuncherGameData,
  LittleMuncherGameStateData,
  LittleMuncherGameState,
  LittleMuncherGameModeData,
  LittleMuncherGameMode,
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayer,
  LittleMuncherSpectatorData,
  LittleMuncherSpectator
> {
  private text!: Phaser.GameObjects.Text;
  private playerInputController!: PlayerInputController;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  override get playerOrNull(): LittleMuncherPlayer | null {
    // there can only be 1 player in little muncher
    if (!this.baseGameData.gameInstance.players.length) return null;
    return this.baseGameData.gameInstance.players[0];
  }

  override init() {
    super.init();
    new Pause(this);
    this.playerInputController = new PlayerInputController(this);
  }

  override create() {
    super.create();
    this.text = this.add.text(100, 100, 'Hello World!');
    this.playerInputController.init(this.text);

    console.log('hill to climb on:', this.gameMode.data.hillToClimbOn);
    console.log('time climbing:', this.gameState.data.timeClimbing);
    console.log('should be paused:', this.gameState.data.pause);

    this.communicator.score?.send({ score: Math.round(Math.random() * 100) }); // todo just for testing
    new Fireworks(this);
  }
}
