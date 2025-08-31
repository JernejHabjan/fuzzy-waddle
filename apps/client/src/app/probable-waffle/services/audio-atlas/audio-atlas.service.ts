import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Howl, SoundSpriteDefinitions } from "howler";
import { AudioAtlasServiceInterface } from "./audio-atlas.service.interface";

interface AudioAtlasData {
  resources: string[];
  spritemap: {
    [key: string]: {
      start: number;
      end: number;
      loop: boolean;
    };
  };
}

@Injectable({
  providedIn: "root"
})
export class AudioAtlasService implements AudioAtlasServiceInterface {
  private audioAtlasData: AudioAtlasData | null = null;
  private howl: Howl | null = null;
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  private readonly http = inject(HttpClient);

  /**
   * Load the audio atlas data and initialize the Howl instance
   */
  loadAudioAtlas(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = firstValueFrom(
      this.http.get<AudioAtlasData>("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json")
    ).then((data) => {
      this.audioAtlasData = data;

      // Convert the spritemap format from start/end to start/duration as required by Howler
      const howlerSprites: SoundSpriteDefinitions = {};

      Object.entries(data.spritemap).forEach(([name, sprite]) => {
        // Howler expects duration in milliseconds
        const start = sprite.start * 1000;
        const duration = (sprite.end - sprite.start) * 1000;
        howlerSprites[name] = [start, duration, sprite.loop];
      });

      this.howl = new Howl({
        src: data.resources,
        sprite: howlerSprites,
        onload: () => {
          this.loaded = true;
        }
      });

      return new Promise<void>((resolve) => {
        if (this.howl?.state() === "loaded") {
          this.loaded = true;
          resolve();
        } else {
          this.howl?.once("load", () => {
            this.loaded = true;
            resolve();
          });
        }
      });
    });

    return this.loadingPromise;
  }

  /**
   * Play a sound from the audio atlas
   * @param name Name of the sound sprite
   * @returns ID of the sound being played (can be used to stop it later)
   */
  async playSound(name: "achievement" | string): Promise<number> {
    if (!this.loaded) {
      await this.loadAudioAtlas();
    }

    if (!this.howl) {
      throw new Error("Audio atlas not loaded");
    }

    // Check if the sprite exists
    if (!this.audioAtlasData?.spritemap[name]) {
      console.warn(`Sound sprite not found: ${name}`);
      return -1;
    }

    return this.howl.play(name);
  }

  /**
   * Stop a specific sound
   * @param id The sound ID returned from playSound
   */
  stopSound(id: number): void {
    if (this.howl && id >= 0) {
      this.howl.stop(id);
    }
  }

  /**
   * Stop all currently playing sounds
   */
  stopAllSounds(): void {
    if (this.howl) {
      this.howl.stop();
    }
  }

  /**
   * Check if the audio atlas is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }
}
