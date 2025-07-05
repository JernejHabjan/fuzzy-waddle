import { TestBed } from "@angular/core/testing";

import { GameInstanceLocalStorageService } from "./game-instance-local-storage.service";

describe("GameInstanceLocalStorageService", () => {
  let service: GameInstanceLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameInstanceLocalStorageService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
