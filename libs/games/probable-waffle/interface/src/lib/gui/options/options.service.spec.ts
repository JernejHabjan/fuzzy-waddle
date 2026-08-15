import { TestBed } from "@angular/core/testing";

import { OptionsService } from "./options.service";
import { provideHttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";

describe("OptionsService", () => {
  let service: OptionsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: {
            sessionChanges: new BehaviorSubject(null),
            ensureAuthReady: () => Promise.resolve(null),
            isAuthenticated: false
          }
        }
      ]
    });
    service = TestBed.inject(OptionsService);
  });

  it("keeps local storage as the anonymous fallback", () => {
    localStorage.setItem("probable-waffle-game-settings", JSON.stringify({ showFps: true }));

    service.init();

    expect(service.gameSettings.showFps).toBe(true);
  });

  it("selects filtered chat text without destroying the original message", () => {
    const original = {
      text: "original",
      filteredText: "filtered",
      userId: "user-1",
      fullName: "Player",
      createdAt: new Date()
    };

    expect(service.presentChatMessage(original).text).toBe("filtered");
    service.gameSettings.profanityFilter = false;
    expect(service.presentChatMessage(original).text).toBe("original");
    expect(original.text).toBe("original");
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
