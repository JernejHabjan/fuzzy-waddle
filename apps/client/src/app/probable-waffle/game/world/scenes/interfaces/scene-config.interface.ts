import { Types } from 'phaser';

export interface CreateSceneFromObjectConfig {
  /**
   * The scene's init callback.
   */
  init?: Types.Scenes.SceneInitCallback;
  /**
   * The scene's preload callback.
   */
  preload?: Types.Scenes.ScenePreloadCallback;
  /**
   * The scene's create callback.
   */
  create?: Types.Scenes.SceneCreateCallback;
  /**
   * Any additional properties, which will be copied to the Scene after it's created (except `data` or `sys`).
   */
  extend?: unknown;
  /**
   * Any values, which will be merged into the Scene's Data Manager store.
   */
  'extend.data'?: unknown;
}
