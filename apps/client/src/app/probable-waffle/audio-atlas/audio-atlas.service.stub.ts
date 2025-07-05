import { AudioAtlasServiceInterface } from "./audio-atlas.service.interface";

export const audioAtlasServiceStub = {
  playSound: function (name: string): Promise<number> {
    throw new Error("Function not implemented.");
  },
  stopSound: function (id: number): void {
    throw new Error("Function not implemented.");
  },
  stopAllSounds: function (): void {
    throw new Error("Function not implemented.");
  },
  loadAudioAtlas: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  isLoaded: function (): boolean {
    throw new Error("Function not implemented.");
  }
} satisfies AudioAtlasServiceInterface;
