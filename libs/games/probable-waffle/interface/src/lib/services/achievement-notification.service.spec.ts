import { TestBed } from "@angular/core/testing";
import { AchievementNotificationService } from "./achievement-notification.service";

describe("AchievementNotificationService", () => {
  it("can clear an empty notification queue", () => {
    const service = TestBed.inject(AchievementNotificationService);

    expect(() => service.clearAll()).not.toThrow();
  });
});
