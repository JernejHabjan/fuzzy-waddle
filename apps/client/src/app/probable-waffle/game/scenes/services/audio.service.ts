import { VolumeSettings } from "../../core/volumeSettings";
import { getGameObjectTransform } from "../../data/game-object-helper";

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

  /**
   * Adding new audio so it does not interfere with other sounds of same key
   */
  playAudio(key: string, soundConfig?: Phaser.Types.Sound.SoundConfig, additionalConfig?: AdditionalAudioConfig) {
    return this.playSound(
      (adjustedSoundConfig: Phaser.Types.Sound.SoundConfig) => {
        this.scene.sound.play(key, adjustedSoundConfig);
        return null;
      },
      key,
      soundConfig,
      additionalConfig
    );
  }

  /**
   * Adding new audio so it does not interfere with other sounds of same key
   */
  playAudioSprite(
    key: string,
    spriteName: string,
    soundConfig?: Phaser.Types.Sound.SoundConfig,
    additionalConfig?: AdditionalAudioConfig
  ) {
    return this.playSound(
      (adjustedSoundConfig: Phaser.Types.Sound.SoundConfig) =>
        this.scene.sound.addAudioSprite(key, adjustedSoundConfig),
      spriteName,
      soundConfig,
      additionalConfig
    );
  }

  private playSound(
    addOrPlayFn: (
      adjustedSoundConfig: Phaser.Types.Sound.SoundConfig
    ) => Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null,
    key: string,
    soundConfig?: Phaser.Types.Sound.SoundConfig,
    additionalConfig?: AdditionalAudioConfig
  ): Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null {
    soundConfig = soundConfig ?? {};
    soundConfig.volume = soundConfig.volume ?? this.sfxVolumeNormalized;
    additionalConfig = additionalConfig ?? {};
    additionalConfig.waitIfLockedOrGameLostFocus = additionalConfig.waitIfLockedOrGameLostFocus ?? false;

    const play = (): Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null => {
      const sound = addOrPlayFn(soundConfig);
      if (!sound) {
        const soundManger = this.scene.sound;
        soundManger.get(key).once(Phaser.Sound.Events.COMPLETE, () => {
          additionalConfig?.onComplete?.();
        });
        return null;
      } else {
        sound.play(key);
        sound.once(Phaser.Sound.Events.COMPLETE, () => {
          additionalConfig?.onComplete?.();
          sound.destroy();
        });
        return sound;
      }
    };

    return this.playWithConfig(play, additionalConfig);
  }

  private playWithConfig(
    play: () => Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null,
    additionalConfig?: AdditionalAudioConfig
  ): Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null {
    const sound = this.scene.sound;
    if (!sound.locked) {
      if (sound.gameLostFocus && !this.playAudioAlsoOnBlur) {
        const canStartPlaying = additionalConfig?.waitIfLockedOrGameLostFocus !== false;
        if (canStartPlaying) {
          return play();
        }
      } else {
        return play();
      }
    } else {
      if (additionalConfig?.waitIfLockedOrGameLostFocus !== false) {
        sound.once(Phaser.Sound.Events.UNLOCKED, () => play());
      }
    }
    return null;
  }

  private normalizeSfxVolume(volumePercentage: number) {
    return (volumePercentage * this.sfxVolumeNormalized) / 100;
  }

  playSpatialAudioSprite(
    gameObject: Phaser.GameObjects.GameObject,
    key: string,
    spriteName: string,
    soundConfig?: Phaser.Types.Sound.SoundConfig,
    additionalConfig?: AdditionalAudioConfig
  ) {
    const adjustedSoundConfig = this.getSpatialSfxConfig(gameObject, soundConfig);
    return this.playAudioSprite(key, spriteName, adjustedSoundConfig, additionalConfig);
  }

  playSpatialAudio(
    gameObject: Phaser.GameObjects.GameObject,
    key: string,
    soundConfig?: Phaser.Types.Sound.SoundConfig,
    additionalConfig?: AdditionalAudioConfig
  ) {
    const adjustedSoundConfig = this.getSpatialSfxConfig(gameObject, soundConfig);
    return this.playAudio(key, adjustedSoundConfig, additionalConfig);
  }

  getSpatialSfxConfig(
    gameObject: Phaser.GameObjects.GameObject,
    soundConfig?: Phaser.Types.Sound.SoundConfig
  ): Phaser.Types.Sound.SoundConfig | undefined {
    const transform = getGameObjectTransform(gameObject);
    if (!transform) return undefined;
    if (!gameObject.active || !gameObject.scene) return undefined;
    const camera = gameObject.scene.cameras.main;
    const { x: camX, y: camY } = camera.midPoint;
    const cameraZoom = camera.zoom;

    // Adjust volume based on the zoom level
    const minZoom = 0.5;
    const maxZoom = 8;
    const minVolume = 30;
    let volume: number;

    if (cameraZoom <= minZoom) {
      volume = minVolume;
    } else if (cameraZoom >= maxZoom) {
      volume = 100;
    } else {
      volume = minVolume + ((cameraZoom - minZoom) / (maxZoom - minZoom)) * 100;
    }

    // Apply any override in soundConfig
    if (soundConfig?.volume !== undefined) {
      volume = (soundConfig.volume * volume) / 100;
    }

    const volumeNormalized = this.normalizeSfxVolume(volume);

    // Compute source position relative to the camera center
    const offsetX = transform.x - camX;
    const offsetY = transform.y - camY;
    const offsetZ = transform.z ?? 0;

    // Shrink audible range as you zoom in:
    // World-space viewport size = camera.width / camera.zoom
    // Use whichever dimension is larger for maxDistance
    const viewWidthWorld = camera.width / cameraZoom;
    const viewHeightWorld = camera.height / cameraZoom;
    const maxAudible = Math.max(viewWidthWorld, viewHeightWorld);

    return {
      volume: volumeNormalized,
      source: {
        x: offsetX,
        y: offsetY,
        z: offsetZ,
        orientationX: 0,
        orientationY: 0,
        orientationZ: -1,
        refDistance: 50,
        rolloffFactor: 1,
        // audible out to the current viewport size
        maxDistance: maxAudible,
        panningModel: "HRTF",
        distanceModel: "linear",
        coneOuterGain: 0.3
      },
      mute: soundConfig?.mute ?? false,
      loop: soundConfig?.loop ?? false,
      delay: soundConfig?.delay ?? 0,
      detune: soundConfig?.detune ?? 0,
      seek: soundConfig?.seek ?? 0,
      rate: soundConfig?.rate ?? 1
    } satisfies Phaser.Types.Sound.SoundConfig;
  }

  stopSound(key: string) {
    this.scene.sound.stopByKey(key);
  }
}
