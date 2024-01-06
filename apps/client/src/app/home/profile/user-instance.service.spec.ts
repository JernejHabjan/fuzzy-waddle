import { TestBed } from "@angular/core/testing";

import { UserInstanceService } from "./user-instance.service";
import { UserInstanceServiceInterface } from "./user-instance.service.interface";

export const userInstanceServiceStub = {
  setVisitedGame(game: "probable-waffle" | "little-muncher" | "fly-squasher") {},
  getPreferredGame(): string | null {
    return null;
  }
} satisfies UserInstanceServiceInterface;
describe("UserInstance", () => {
  let service: UserInstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserInstanceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
