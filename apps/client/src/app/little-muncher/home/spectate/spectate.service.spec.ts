import { TestBed } from "@angular/core/testing";

import { SpectateService } from "./spectate.service";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.stub";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("SpectateService", () => {
  let service: SpectateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(SpectateService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
