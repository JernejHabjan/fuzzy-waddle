import { environment } from '../../../../../environments/environment';
import { Types } from 'phaser';
import { baseGameConfig } from '../../../../shared/game/base-game.config';
import Map1 from "../../scenes/Map1";
import PreloadProbableWaffle from "../../scenes/PreloadProbableWaffle";
import {Boot} from "../../scenes/Boot";

export const probableWaffleGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  // scene: [GrasslandScene, PlaygroundScene],
  scene: [Boot, PreloadProbableWaffle, Map1],
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 0 },
      debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: '#222'
};
