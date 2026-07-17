import type { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";
import { GameSaveCodecServiceInterface } from "./game-save-codec.service.interface";

/** Deterministic test codec that preserves the production serialization boundary. */
export class GameSaveCodecServiceStub extends GameSaveCodecServiceInterface {
  override async encode(data: ProbableWaffleGameInstanceData): Promise<string> {
    return JSON.stringify(data);
  }
  override async decode(encodedData: string): Promise<ProbableWaffleGameInstanceData> {
    return JSON.parse(encodedData) as ProbableWaffleGameInstanceData;
  }
}
