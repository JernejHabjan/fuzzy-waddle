import { Howl } from "howler";
import type { GameSound } from "@fuzzy-waddle/trump-defense-gameplay";
import { assetUrl } from "./asset-paths";

const soundFiles: Record<GameSound, string> = {
  spawn: "spawn.wav",
  baloon: "baloon.wav",
  cash: "cash.wav",
  die: "die.wav",
  pew: "pew.wav",
  cannon: "cannon.wav",
  buildWall: "buildWall.wav",
  select: "pew.wav"
};

/** Audio starts from a user action, as required by browser autoplay policies. */
export class GameAudio {
  private music: Howl | null = null;
  private readonly effects = new Map<GameSound, Howl>();
  private muted = false;

  startMusic(path: string): void {
    this.music?.unload();
    this.music = new Howl({ src: [assetUrl(path)], html5: true, loop: true, volume: 0.35 });
    if (!this.muted) this.music.play();
  }

  play(sound: GameSound): void {
    if (this.muted) return;
    let effect = this.effects.get(sound);
    if (!effect) {
      effect = new Howl({ src: [assetUrl(`sfx/${soundFiles[sound]}`)], volume: 0.48 });
      this.effects.set(sound, effect);
    }
    effect.play();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.music?.mute(muted);
    for (const effect of this.effects.values()) effect.mute(muted);
    if (!muted && this.music && !this.music.playing()) this.music.play();
  }

  pause(): void {
    this.music?.pause();
  }
  resume(): void {
    if (!this.muted) this.music?.play();
  }

  stop(): void {
    this.music?.unload();
    this.music = null;
    for (const effect of this.effects.values()) effect.stop();
  }

  dispose(): void {
    this.stop();
    for (const effect of this.effects.values()) effect.unload();
    this.effects.clear();
    // This adapter only owns its Howls; never stop other games' global audio.
  }
}
