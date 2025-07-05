import { TestBed } from "@angular/core/testing";
import { GameInstanceIndexeddbStorageService } from "./game-instance-indexeddb-storage.service";

describe("GameInstanceIndexeddbStorageService", () => {
  let service: GameInstanceIndexeddbStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameInstanceIndexeddbStorageService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
