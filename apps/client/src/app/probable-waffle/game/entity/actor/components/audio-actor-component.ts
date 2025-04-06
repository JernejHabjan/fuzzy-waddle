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
  private playedSoundIndexes: { [key in (SoundType | string)]?: number[] } = {};
  private lastPlayedSoundIndex: { [key in (SoundType | string)]?: number } = {};
  private previousSoundType: SoundType | string | null = null;

  constructor(
    public readonly gameObject: Phaser.GameObjects.GameObject,
    public audioDefinition: AudioDefinition | null = null
  ) {
    onObjectReady(gameObject, this.init, this);
  }

  playOrderSound(action: OrderData) {
    this.playSound(this.getActionSound(action), this.mapOrderTypeToSoundType(action.orderType));
  }

  playCustomSound(key: SoundType | string) {
    this.playSound(this.getCustomSound(key), key);
  }

  private init() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
  }

  private getActionSound(action: OrderData) {
    return this.getSound(this.mapOrderTypeToSoundType(action.orderType));
  }

  private getCustomSound(key: SoundType | string) {
    return this.getSound(key);
  }

  private getSound(key: SoundType | string | null) {
    if (!this.audioDefinition || !key) return null;
    const soundDefinitions = this.audioDefinition.sounds[key];
    if (!soundDefinitions) return null;

    if (!this.playedSoundIndexes[key]) {
      this.playedSoundIndexes[key] = this.shuffleArray([...Array(soundDefinitions.length).keys()]);
    }

    const playedIndexes = this.playedSoundIndexes[key];
    if (!playedIndexes || playedIndexes.length === 0) return null;

    let soundIndex = playedIndexes.pop();
    if (playedIndexes.length === 0) {
      this.playedSoundIndexes[key] = this.shuffleArray([...Array(soundDefinitions.length).keys()]);
    }

    // Ensure the last played sound is not repeated if there are multiple sounds
    if (soundDefinitions.length > 1 && soundIndex === this.lastPlayedSoundIndex[key]) {
      soundIndex = playedIndexes.pop();
      if (playedIndexes.length === 0) {
        this.playedSoundIndexes[key] = this.shuffleArray([...Array(soundDefinitions.length).keys()]);
      }
    }

    this.lastPlayedSoundIndex[key] = soundIndex;

    return soundDefinitions[soundIndex!];
  }

  private playSound(soundDefinition: SoundDefinition | null, key: SoundType | string | null) {
    if (!this.audioService || !soundDefinition || !key) return;

    if (this.previousSoundType === key) return;

    if (this.previousSoundType !== null) {
      this.audioService.stopSound(soundDefinition.key);
    }

    this.previousSoundType = key;
    this.audioService.playAudioSprite(soundDefinition.key, soundDefinition.spriteName, undefined, {
      onComplete: () => (this.previousSoundType = null)
    });
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
}
