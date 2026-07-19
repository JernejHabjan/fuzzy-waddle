import { TestBed } from "@angular/core/testing";
import { TauriService } from "./tauri.service";

describe("TauriService", () => {
  beforeEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("uses safe no-op behavior in a browser", async () => {
    const service = TestBed.inject(TauriService);

    expect(service.isDesktop).toBe(false);
    await expect(service.toggleFullscreen()).resolves.toBe(false);
    await expect(service.getAppVersion()).resolves.toBe("");
    await expect(service.openInBrowser("https://example.com")).resolves.toBeUndefined();
  });
});
