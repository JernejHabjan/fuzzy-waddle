import { TestBed } from "@angular/core/testing";
import { DEPRECATED_gameInstanceService } from "./DEPRECATED_game-instance.service";

describe("DEPRECATED_GameInstanceService", () => {
  let service: DEPRECATED_gameInstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DEPRECATED_gameInstanceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
