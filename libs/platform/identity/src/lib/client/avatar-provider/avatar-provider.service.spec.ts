import { TestBed } from "@angular/core/testing";
import { AvatarProviderService } from "./avatar-provider.service";

describe("AvatarProviderService", () => {
  let service: AvatarProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvatarProviderService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
