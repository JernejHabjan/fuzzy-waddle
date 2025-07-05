import { TestBed } from "@angular/core/testing";
import { RoomsService } from "./rooms.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.stub";
import { provideHttpClient } from "@angular/common/http";

describe("RoomsService", () => {
  let service: RoomsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(RoomsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
