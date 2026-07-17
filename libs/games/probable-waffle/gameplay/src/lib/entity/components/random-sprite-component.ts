import { RandomService } from "../../world/services/random.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Picks one frame at random from the provided list and applies it to the parent
 * GameObject on construction.
 *
 * Used for static environment objects that have multiple visual variants
 * (e.g. several gravestone sprites) so the world looks varied without
 * requiring a separate prefab per variant.
 */
export class RandomSpriteComponent {
  constructor(gameObject: GameObject, frames: string[]) {
    if (!frames.length) return;
    const randomService = getSceneService(gameObject.scene, RandomService)!;
    const frame: string = randomService.pick(frames);
    if (gameObject instanceof Phaser.GameObjects.Image || gameObject instanceof Phaser.GameObjects.Sprite) {
      gameObject.setFrame(frame);
    }
  }
}
