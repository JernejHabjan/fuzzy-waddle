import type { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";

/** Encodes save payloads for local persistence and authenticated synchronization. */
export abstract class GameSaveCodecServiceInterface {
  abstract encode(data: ProbableWaffleGameInstanceData): Promise<string>;
  abstract decode(encodedData: string): Promise<ProbableWaffleGameInstanceData>;
}
