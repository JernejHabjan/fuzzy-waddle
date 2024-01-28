import { Scale, Types } from "phaser";
import { GameContainerElement } from "./game-container/game-container";

export const baseGameConfig: Types.Core.GameConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
  disableContextMenu: true,
  scale: {
    mode: Scale.RESIZE
  },
  fps: {
    target: 60,
    min: 30
  },
  parent: GameContainerElement
};
