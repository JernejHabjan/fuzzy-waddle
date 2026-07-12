import { TestBed } from "@angular/core/testing";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { GameSaveRepository } from "./game-save.repository";
import { GameSaveSyncService } from "./game-save-sync.service";

describe("GameSaveSyncService", () => {
  it("pulls remote state before uploading queued local saves", async () => {
    const http = { get: jest.fn(() => of([])), post: jest.fn(() => of({})) };
    const repository = {
      listIncludingDeleted: jest.fn(async () => [
        { id: "save-1", syncState: "local", scope: "skirmish", kind: "manual", revision: 1 }
      ]),
      upsert: jest.fn(async () => undefined),
      remove: jest.fn(async () => undefined)
    };
    TestBed.configureTestingModule({
      providers: [
        GameSaveSyncService,
        { provide: HttpClient, useValue: http },
        { provide: AuthService, useValue: { isAuthenticated: true } },
        { provide: GameSaveRepository, useValue: repository }
      ]
    });

    await TestBed.inject(GameSaveSyncService).flush();

    expect(http.get).toHaveBeenCalled();
    expect(http.post).toHaveBeenCalled();
    expect(repository.upsert).toHaveBeenCalledWith(expect.objectContaining({ syncState: "synced" }));
  });
});
