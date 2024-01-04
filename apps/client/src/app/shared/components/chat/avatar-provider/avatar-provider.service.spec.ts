import { TestBed } from "@angular/core/testing";

import { AvatarProviderService } from "./avatar-provider.service";
import { IAvatarProviderService } from "./avatar-provider.service.interface";

export const avatarProviderServiceStub = {
  getAvatar(seed: string): string {
    return "";
  }
} satisfies IAvatarProviderService;

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
