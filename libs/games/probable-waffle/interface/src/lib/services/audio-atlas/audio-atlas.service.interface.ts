export interface AudioAtlasServiceInterface {
  /**
   * Play a sound from the audio atlas
   * @param name Name of the sound sprite
   * @returns ID of the sound being played (can be used to stop it later)
   */
  playSound(name: string): Promise<number>;

  /**
   * Stop a specific sound
   * @param id The sound ID returned from playSound
   */
  stopSound(id: number): void;

  /**
   * Stop all currently playing sounds
   */
  stopAllSounds(): void;

  /**
   * Load the audio atlas data
   */
  loadAudioAtlas(): Promise<void>;

  /**
   * Check if the audio atlas is loaded
   */
  isLoaded(): boolean;
}
