import { VolumeSettings } from "../../core/volumeSettings";

export interface AdditionalAudioConfig {
  onComplete?: () => void;
  waitIfLockedOrGameLostFocus?: boolean;
}

export class AudioService {
  private readonly playAudioAlsoOnBlur = true;
  private readonly skaduweeOst = ["land-of-ice", "winter-tale"];
  private readonly ost = [...this.skaduweeOst];
  private ostQueue: string[] = [];

  private volumeSettings = new VolumeSettings();
  private currentTrackIndex = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.volumeSettings.init();
    this.shuffleOstQueue();
    this.scene.sound.pauseOnBlur = !this.playAudioAlsoOnBlur;
  }

  private get volumeRatio() {
    return this.volumeSettings.masterVolume / 100;
  }

  get sfxVolumeNormalized() {
    return (this.volumeSettings.sfxVolume * this.volumeRatio) / 100;
  }

  get musicVolumeNormalized() {
    return (this.volumeSettings.musicVolume * this.volumeRatio) / 100;
  }

  private shuffleOstQueue() {
    this.ostQueue = this.ost.sort(() => Math.random() - 0.5);
    this.currentTrackIndex = 0;
  }

  playMusicByShuffledPlaylist() {
    if (this.currentTrackIndex >= this.ostQueue.length) {
      this.shuffleOstQueue(); // Reshuffle once all tracks are played
    }

    const music = this.ostQueue[this.currentTrackIndex];
    this.currentTrackIndex++;

    this.playAudio(
      music,
      { loop: false, volume: this.musicVolumeNormalized },
      {
        onComplete: () => {
          this.playMusicByShuffledPlaylist();
        },
        waitIfLockedOrGameLostFocus: true
      }
    );
  }

  playAudio(key: string, soundConfig?: Phaser.Types.Sound.SoundConfig, additionalConfig?: AdditionalAudioConfig) {
    this.playSound(
      (adjustedSoundConfig: Phaser.Types.Sound.SoundConfig) => this.scene.sound.play(key, adjustedSoundConfig),
      key,
      soundConfig,
      additionalConfig
    );
  }

  playAudioSprite(
    key: string,
    spriteName: string,
    soundConfig?: Phaser.Types.Sound.SoundConfig,
    additionalConfig?: AdditionalAudioConfig
  ) {
    this.playSound(
      (adjustedSoundConfig: Phaser.Types.Sound.SoundConfig) =>
        this.scene.sound.playAudioSprite(key, spriteName, adjustedSoundConfig),
      key,
      soundConfig,
      additionalConfig
    );
  }

  private playSound(
    playFn: (adjustedSoundConfig: Phaser.Types.Sound.SoundConfig) => void,
    key: string,
    soundConfig?: Phaser.Types.Sound.SoundConfig,
    additionalConfig?: AdditionalAudioConfig
  ) {
    const sound = this.scene.sound;
    soundConfig = soundConfig ?? {};
    soundConfig.volume = soundConfig.volume ?? this.sfxVolumeNormalized;
    additionalConfig = additionalConfig ?? {};
    additionalConfig.waitIfLockedOrGameLostFocus = additionalConfig.waitIfLockedOrGameLostFocus ?? false;

    const play = () => {
      playFn(soundConfig);
      sound.get(key).once(Phaser.Sound.Events.COMPLETE, () => {
        additionalConfig?.onComplete?.();
      });
    };

    this.playWithConfig(play, additionalConfig);
  }

  private playWithConfig(play: () => void, additionalConfig?: AdditionalAudioConfig) {
    const sound = this.scene.sound;
    if (!sound.locked) {
      if (sound.gameLostFocus && !this.playAudioAlsoOnBlur) {
        const canStartPlaying = additionalConfig?.waitIfLockedOrGameLostFocus !== false;
        if (canStartPlaying) {
          play();
        }
      } else {
        play();
      }
    } else {
      if (additionalConfig?.waitIfLockedOrGameLostFocus !== false) {
        sound.once(Phaser.Sound.Events.UNLOCKED, () => play());
      }
    }
  }
}
