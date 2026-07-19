import { TestBed } from "@angular/core/testing";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { openUrl } from "@tauri-apps/plugin-opener";
import { TauriService } from "./tauri.service";

jest.mock("@tauri-apps/plugin-deep-link", () => ({
  onOpenUrl: jest.fn()
}));

jest.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: jest.fn()
}));

describe("TauriService", () => {
  const onOpenUrlMock = jest.mocked(onOpenUrl);
  const openUrlMock = jest.mocked(openUrl);

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    onOpenUrlMock.mockReset();
    openUrlMock.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses safe no-op behavior in a browser", async () => {
    const service = TestBed.inject(TauriService);

    expect(service.isDesktop).toBe(false);
    await expect(service.toggleFullscreen()).resolves.toBe(false);
    await expect(service.getAppVersion()).resolves.toBe("");
    await expect(service.openInBrowser("https://example.com")).resolves.toBeUndefined();
  });

  it("shares one deep-link listener initialization across concurrent callers", async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    onOpenUrlMock.mockResolvedValue(jest.fn());
    const service = TestBed.inject(TauriService);

    await Promise.all([service.initDeepLinkListener(), service.initDeepLinkListener()]);

    expect(onOpenUrlMock).toHaveBeenCalledTimes(1);
  });

  it("propagates native opener failures to the owning workflow", async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    const openerError = new Error("opener failed");
    jest.spyOn(console, "error").mockImplementation();
    openUrlMock.mockRejectedValue(openerError);
    const service = TestBed.inject(TauriService);

    await expect(service.openInBrowser("https://example.com")).rejects.toBe(openerError);
  });

  it("allows listener initialization to retry after a failure", async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    const listenerError = new Error("listener failed");
    jest.spyOn(console, "error").mockImplementation();
    onOpenUrlMock.mockRejectedValueOnce(listenerError).mockResolvedValue(jest.fn());
    const service = TestBed.inject(TauriService);

    await expect(service.initDeepLinkListener()).rejects.toBe(listenerError);
    await expect(service.initDeepLinkListener()).resolves.toBeUndefined();

    expect(onOpenUrlMock).toHaveBeenCalledTimes(2);
  });
});
