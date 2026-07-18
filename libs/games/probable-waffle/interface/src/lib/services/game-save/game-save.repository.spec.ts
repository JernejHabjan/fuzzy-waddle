import { TestBed } from "@angular/core/testing";
import {
  GAME_SAVE_FORMAT_VERSION,
  GameSaveKind,
  GameSaveScope,
  GameSaveSyncState,
  type EncodedGameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveRepository } from "./game-save.repository";

type GameSaveRepositoryInternals = {
  read(): Promise<EncodedGameSaveRecord[]>;
};

describe("GameSaveRepository", () => {
  function record(
    id: string,
    updatedAt: string,
    syncState: GameSaveSyncState = GameSaveSyncState.Local
  ): EncodedGameSaveRecord {
    return {
      id,
      formatVersion: GAME_SAVE_FORMAT_VERSION,
      scope: GameSaveScope.Skirmish,
      kind: GameSaveKind.Manual,
      createdAt: updatedAt,
      updatedAt,
      revision: 1,
      syncState,
      encodedGameInstanceData: "encoded"
    };
  }

  it("filters tombstones and sorts newest saves first", async () => {
    const repository = TestBed.inject(GameSaveRepository);
    jest
      .spyOn(repository as unknown as GameSaveRepositoryInternals, "read")
      .mockResolvedValue([
        record("older", "2026-01-01T00:00:00.000Z"),
        record("deleted", "2026-03-01T00:00:00.000Z", GameSaveSyncState.Deleted),
        record("newer", "2026-02-01T00:00:00.000Z")
      ]);

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({ id: "newer" }),
      expect.objectContaining({ id: "older" })
    ]);
  });
});
