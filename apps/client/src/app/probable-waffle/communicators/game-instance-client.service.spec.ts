import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.stub";
import { gameInstanceLocalStorageServiceStub } from "./storage/game-instance-local-storage.service.stub";
import { GameInstanceStorageServiceInterface } from "./storage/game-instance-storage.service.interface";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";

describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: GameInstanceStorageServiceInterface, useValue: gameInstanceLocalStorageServiceStub }
      ]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
