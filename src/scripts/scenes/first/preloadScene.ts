import { Scenes } from "../scenes";
import { CreateSceneFromObjectConfig } from "../../phaser/phaser";
import { AssetsFirst } from "./assets";

export default class PreloadScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  constructor() {
    super({ key: Scenes.PreloadScene });
  }

  preload() {
    this.load.image(AssetsFirst.loader, "assets/img/birdy-nam-nam-loader.png");
    this.load.image(AssetsFirst.click, "assets/img/birdy-nam-nam-click.png");
  }

  create() {
    this.scene.start(Scenes.MainScene);

    /**
     * This is how you would dynamically import the mainScene class (with code splitting),
     * add the mainScene to the Scene Manager
     * and start the scene.
     * The name of the chunk would be 'mainScene.chunk.js
     * Find more about code splitting here: https://webpack.js.org/guides/code-splitting/
     */
    // let someCondition = true
    // if (someCondition)
    //   import(/* webpackChunkName: "mainScene" */ './mainScene').then(mainScene => {
    //     this.scene.add('MainScene', mainScene.default, true)
    //   })
    // else console.log('The mainScene class will not even be loaded by the browser')
  }
}
