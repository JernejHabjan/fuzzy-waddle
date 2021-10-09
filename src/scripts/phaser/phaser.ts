export interface CreateSceneFromObjectConfig {
  /**
   * The scene's init callback.
   */
  init?: Phaser.Types.Scenes.SceneInitCallback;
  /**
   * The scene's preload callback.
   */
  preload?: Phaser.Types.Scenes.ScenePreloadCallback;
  /**
   * The scene's create callback.
   */
  create?: Phaser.Types.Scenes.SceneCreateCallback;
  /**
   * Any additional properties, which will be copied to the Scene after it's created (except `data` or `sys`).
   */
  extend?: any;
  /**
   * Any values, which will be merged into the Scene's Data Manager store.
   */
  "extend.data"?: any;
}
