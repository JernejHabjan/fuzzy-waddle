import { TestBed } from "@angular/core/testing";
import { GameInstanceClientService } from "./game-instance-client.service";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.stub";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
