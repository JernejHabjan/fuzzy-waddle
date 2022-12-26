import { IComponent } from '../services/component.service';

export class CharacterSoundComponent implements IComponent {
  private gameObject!: Phaser.GameObjects.Sprite;

  init(gameObject: Phaser.GameObjects.Sprite) {
    this.gameObject = gameObject;
  }

  play(key: string, loop: boolean = false) {
    const { scene } = this.gameObject;
    if (scene.sound.locked) {
      return;
    }

    // get sound from scene
    const sound = scene.sound.get(key);

    // if sound is not playing, then play it
    if (!sound.isPlaying) {
      sound.play({ loop });
    }
  }

  stop(key: string) {
    const { scene } = this.gameObject;
    if (scene.sound.locked) {
      return;
    }

    // get sound from scene
    const sound = scene.sound.get(key);

    // if sound is playing, then stop it
    if (sound.isPlaying) {
      sound.stop();
    }
  }
}
