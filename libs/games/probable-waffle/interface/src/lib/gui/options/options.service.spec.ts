import { TestBed } from "@angular/core/testing";

import { OptionsService } from "./options.service";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { BehaviorSubject } from "rxjs";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";

describe("OptionsService", () => {
  let service: OptionsService;
  const auth = {
    sessionChanges: new BehaviorSubject(null),
    ensureAuthReady: () => Promise.resolve(null),
    isAuthenticated: false
  };

  beforeEach(() => {
    localStorage.clear();
    auth.isAuthenticated = false;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: auth
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

  it("does not reveal the original text when filtering produces an empty string", () => {
    const message = { text: "original", filteredText: "", userId: "user-1", fullName: "Player", createdAt: new Date() };
    expect(service.presentChatMessage(message).text).toBe("");
  });

  it("uploads an edit made while remote preferences are loading", async () => {
    auth.isAuthenticated = true;
    const initialized = service.init();
    await Promise.resolve();
    const http = TestBed.inject(HttpTestingController);
    const get = http.expectOne((request) => request.method === "GET");
    service.gameSettings.showFps = true;
    service.saveChanges("game");
    get.flush({ ...service.gameSettings, showFps: false });
    await Promise.resolve();
    const put = http.expectOne((request) => request.method === "PUT");
    expect(put.request.body.preferences.showFps).toBe(true);
    put.flush(put.request.body.preferences);
    await initialized;
    expect(service.gameSettings.showFps).toBe(true);
    http.verify();
  });

  it("serializes edits during an upload and retains the pending marker until the latest succeeds", async () => {
    auth.isAuthenticated = true;
    service.gameSettings.showFps = true;
    service.saveChanges("game");
    await Promise.resolve();
    const http = TestBed.inject(HttpTestingController);
    const first = http.expectOne((request) => request.method === "PUT");
    service.gameSettings.showPing = true;
    service.saveChanges("game");
    first.flush(first.request.body.preferences);
    await Promise.resolve();
    const second = http.expectOne((request) => request.method === "PUT");
    expect(second.request.body.preferences.showPing).toBe(true);
    expect(localStorage.getItem("probable-waffle-game-settings-pending-sync")).toBe("true");
    second.flush(second.request.body.preferences);
    await Promise.resolve();
    expect(localStorage.getItem("probable-waffle-game-settings-pending-sync")).toBeNull();
    http.verify();
  });

  it("preserves pending offline edits across service recreation", async () => {
    service.gameSettings.showFps = true;
    service.saveChanges("game");
    await Promise.resolve();
    TestBed.resetTestingModule();
    auth.isAuthenticated = true;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: auth }]
    });
    const restored = TestBed.inject(OptionsService);
    const initialized = restored.init();
    await Promise.resolve();
    const http = TestBed.inject(HttpTestingController);
    const put = http.expectOne((request) => request.method === "PUT");
    expect(put.request.body.preferences.showFps).toBe(true);
    put.flush(put.request.body.preferences);
    await initialized;
    http.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
