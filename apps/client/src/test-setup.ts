import 'jest-canvas-mock';
import 'jest-preset-angular/setup-jest';

import * as failOnConsole from 'jest-fail-on-console';

failOnConsole();

// make sure to mock @dicebear/core and @dicebear/pixel-art using jest so that we don't get following error:
// import * as license from './utils/license.js';
// ^^^^^^
//
// SyntaxError: Cannot use import statement outside a module
jest.mock('@dicebear/core', () => {
  return {
    createAvatar: () => {
      return '';
    }
  };
});

jest.mock('@dicebear/pixel-art', () => {
  return {
    sprites: {}
  };
});

///Cannot find module 'phaser3spectorjs' from '../../node_modules/.pnpm/phaser@3.60.0/node_modules/phaser/src/renderer/webgl/WebGLRenderer.js'
//
// Require stack:
//   C:/Git/Jernej/fuzzy-waddle/node_modules/.pnpm/phaser@3.60.0/node_modules/phaser/src/renderer/webgl/WebGLRenderer.js
//   C:/Git/Jernej/fuzzy-waddle/node_modules/.pnpm/phaser@3.60.0/node_modules/phaser/src/renderer/webgl/index.js
//   C:/Git/Jernej/fuzzy-waddle/node_modules/.pnpm/phaser@3.60.0/node_modules/phaser/src/renderer/index.js
//   C:/Git/Jernej/fuzzy-waddle/node_modules/.pnpm/phaser@3.60.0/node_modules/phaser/src/phaser.js
//   src/app/shared/game/phaser/game/base-game.ts
//   src/app/shared/game/game-container/game-container.component.ts
//   src/app/shared/game/game-container/game-container.component.spec.ts
//
// > 1 | import { Game } from 'phaser';
jest.mock('phaser', () => {
  return {
    Game: class Game {
      constructor() {
        //
      }

      destroy() {
        //
      }
    }
  };
});
