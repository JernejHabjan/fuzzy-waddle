import { Injectable } from "@angular/core";
import { PROBABLE_WAFFLE_SAVE_DATA_KEY, type ProbableWaffleGameInstanceData } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveCodecServiceInterface } from "./game-save-codec.service.interface";

const IV_LENGTH = 12;

/** AES-GCM codec used to deter casual editing of local and network save payloads. */
@Injectable({ providedIn: "root" })
export class GameSaveCodecService implements GameSaveCodecServiceInterface {
  async encode(data: ProbableWaffleGameInstanceData): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await this.importKey(), plaintext);
    return this.toBase64(new Uint8Array([...iv, ...new Uint8Array(ciphertext)]));
  }

  async decode(encodedData: string): Promise<ProbableWaffleGameInstanceData> {
    const bytes = this.fromBase64(encodedData);
    const iv = bytes.slice(0, IV_LENGTH);
    const ciphertext = bytes.slice(IV_LENGTH);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await this.importKey(), ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext)) as ProbableWaffleGameInstanceData;
  }

  private async importKey(): Promise<CryptoKey> {
    const bytes = PROBABLE_WAFFLE_SAVE_DATA_KEY.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16));
    if (!bytes) throw new Error("The save-data key is invalid");
    return crypto.subtle.importKey("raw", new Uint8Array(bytes), "AES-GCM", false, ["encrypt", "decrypt"]);
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  private fromBase64(value: string): Uint8Array {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }
}
