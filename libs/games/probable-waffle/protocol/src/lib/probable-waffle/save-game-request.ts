import type { ProbableWaffleGameInstanceData } from "../game-instance/probable-waffle/game-instance";
import type { GameSaveKind, GameSaveRecord, GameSaveScope } from "./campaign";

/** Defines the save game request contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface SaveGameRequest {
  /**
   * discriminator for {@link SaveGameRequest}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  scope: GameSaveScope;
  /**
   * discriminator for {@link SaveGameRequest}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  kind: GameSaveKind;
  /**
   * Optional human-facing name for {@link SaveGameRequest}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  name?: string;
  /**
   * Optional string thumbnail carried by {@link SaveGameRequest}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  thumbnail?: string;
  /**
   * game instance data value carried by {@link SaveGameRequest}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  gameInstanceData: ProbableWaffleGameInstanceData;
  /** Documents the overwrite save id member and its declared contract at this boundary. */
  overwriteSaveId?: GameSaveRecord["id"];
  /**
   * Optional campaign value carried by {@link SaveGameRequest}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign?: GameSaveRecord["campaign"];
}
