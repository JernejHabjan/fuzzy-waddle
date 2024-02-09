import { GameObjects } from "phaser";
export class CharacterSoundComponent {
  constructor(private readonly gameObject: GameObjects.GameObject) {}

  play(key: string, loop: boolean = false) {
    const { scene } = this.gameObject;
    if (scene.sound.locked) return;

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
