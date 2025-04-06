import { OrderData } from "../../character/ai/OrderData";
import { onObjectReady } from "../../../data/game-object-helper";
import { AudioService } from "../../../scenes/services/audio.service";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { OrderType } from "../../character/ai/order-type";

export enum SoundType {
  Select = "select",
  SelectExtra = "selectExtra",
  Move = "move",
  LocationUnavailable = "locationUnavailable",
  Attack = "attack",
  Build = "build",
  Chop = "chop",
  Mine = "mine",
  Repair = "repair",
  Heal = "heal",
  EnterContainer = "enterContainer",
  Damage = "damage",
  Death = "death",
  Stop = "stop"
}

export type SoundDefinition = {
  key: string;
  spriteName: string;
};

export interface AudioDefinition {
  sounds: {
    [key: string | SoundType]: SoundDefinition[];
  };
}

export class AudioActorComponent {
  private audioService?: AudioService;
  private playedSoundIndexes: { [key in SoundType]?: number[] } = {};
  private lastPlayedSoundIndex: { [key in SoundType]?: number } = {};
  private previousOrderType: OrderType | null = null;

  constructor(
    public readonly gameObject: Phaser.GameObjects.GameObject,
    public audioDefinition: AudioDefinition | null = null
  ) {
    onObjectReady(gameObject, this.init, this);
  }

  playOrderSound(action: OrderData) {
    if (!this.audioService) return;
    const soundDefinition = this.getActionSound(action);
    if (soundDefinition === null) return;
    const orderType = action.orderType;
    const previousOrderType = this.previousOrderType;
    // ensure not to play the sound again if it's already being played
    if (previousOrderType === orderType) return;
    if (previousOrderType !== null) {
      // order changed - stop the previous sound
      this.audioService.stopSound(soundDefinition.key);
    }
    this.previousOrderType = orderType;
    this.audioService.playAudioSprite(soundDefinition.key, soundDefinition.spriteName, undefined, {
      // reset audio sprite when the sound is finished
      onComplete: () => (this.previousOrderType = null)
    });
  }

  playCustomSound(key: SoundType | string) {
    if (!this.audioService) return;
    const sounds = this.audioDefinition?.sounds;
    if (!sounds) return;
    const soundDefinitions = sounds[key];
    if (!soundDefinitions || soundDefinitions.length === 0) return;
    // get a random sound from the array
    const randomIndex = Math.floor(Math.random() * soundDefinitions.length); // todo adjust this later so they don't repeat
    const soundDefinition = soundDefinitions[randomIndex];
    // stop all sounds with the same key
    this.stopAllSounds(soundDefinition.key);
    this.audioService.playAudioSprite(soundDefinition.key, soundDefinition.spriteName);
  }

  private init() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
  }

  private getActionSound(action: OrderData) {
    if (!this.audioDefinition) return null;
    const sounds = this.audioDefinition.sounds;
    const soundType = this.mapOrderTypeToSoundType(action.orderType);
    if (!soundType) return null;
    const soundDefinitions = sounds[soundType];
    if (!soundDefinitions) return null;

    if (!this.playedSoundIndexes[soundType]) {
      this.playedSoundIndexes[soundType] = this.shuffleArray([...Array(soundDefinitions.length).keys()]);
    }

    const playedIndexes = this.playedSoundIndexes[soundType];
    if (!playedIndexes || playedIndexes.length === 0) return null;

    let soundIndex = playedIndexes.pop();
    if (playedIndexes.length === 0) {
      this.playedSoundIndexes[soundType] = this.shuffleArray([...Array(soundDefinitions.length).keys()]);
    }

    // Ensure the last played sound is not repeated if there are multiple sounds
    if (soundDefinitions.length > 1 && soundIndex === this.lastPlayedSoundIndex[soundType]) {
      soundIndex = playedIndexes.pop();
      if (playedIndexes.length === 0) {
        this.playedSoundIndexes[soundType] = this.shuffleArray([...Array(soundDefinitions.length).keys()]);
      }
    }

    this.lastPlayedSoundIndex[soundType] = soundIndex;

    return soundDefinitions[soundIndex!];
  }

  private shuffleArray(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private mapOrderTypeToSoundType(orderType: OrderType): SoundType | null {
    switch (orderType) {
      case OrderType.Attack:
        return SoundType.Attack;
      case OrderType.Build:
        return SoundType.Build;
      case OrderType.Gather:
        return SoundType.Chop;
      case OrderType.Move:
        return SoundType.Move;
      case OrderType.ReturnResources:
        return SoundType.Move;
      case OrderType.Stop:
        return SoundType.Stop;
      case OrderType.Repair:
        return SoundType.Repair;
      case OrderType.Heal:
        return SoundType.Heal;
      case OrderType.EnterContainer:
        return SoundType.EnterContainer;
      default:
        return null;
    }
  }

  private stopAllSounds(key: string) {
    if (!this.audioService) return;
    this.audioService.stopSound(key);
  }
}
