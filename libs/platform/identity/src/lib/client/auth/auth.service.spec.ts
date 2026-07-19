import { TestBed } from "@angular/core/testing";

import { AuthService } from "./auth.service";
import { DataAccessService } from "../data-access.service";
import { DESKTOP_AUTH_BRIDGE } from "./desktop-auth-bridge";
import { Subject } from "rxjs";

describe("AuthService", () => {
  let service: AuthService;
  let deepLinkSubject: Subject<string>;
  let oauthRedirectUrl: string | null;
  let desktopAuthBridge: {
    isDesktop: boolean;
    deepLink$: Subject<string>;
    initDeepLinkListener: jest.Mock;
    openInBrowser: jest.Mock;
  };
  let supabase: {
    auth: {
      signInWithOAuth: jest.Mock;
      exchangeCodeForSession: jest.Mock;
      setSession: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
    oauthRedirectUrl = null;
    deepLinkSubject = new Subject<string>();
    desktopAuthBridge = {
      isDesktop: true,
      deepLink$: deepLinkSubject,
      initDeepLinkListener: jest.fn().mockResolvedValue(undefined),
      openInBrowser: jest.fn()
    };
    supabase = {
      auth: {
        signInWithOAuth: jest.fn().mockImplementation(async (request: { options?: { redirectTo?: string } }) => {
          oauthRedirectUrl = request.options?.redirectTo ?? null;
          return {
            data: { url: "https://accounts.google.com/oauth" },
            error: null
          };
        }),
        exchangeCodeForSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        setSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null })
      }
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DataAccessService, useValue: { supabase } },
        { provide: DESKTOP_AUTH_BRIDGE, useValue: desktopAuthBridge }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("waits for the first OAuth deep link after opening the browser", async () => {
    desktopAuthBridge.openInBrowser.mockImplementation(async () => {
      if (!oauthRedirectUrl) throw new Error("OAuth redirect URL was not captured");
      const nonce = new URL(oauthRedirectUrl).searchParams.get("desktop_auth_nonce");
      if (!nonce) throw new Error("OAuth redirect URL did not contain a nonce");

      deepLinkSubject.next(
        `com.fuzzywaddle.probablewaffle://other/callback?desktop_auth_nonce=${nonce}&code=wrong`
      );
      deepLinkSubject.next(
        "com.fuzzywaddle.probablewaffle://auth/callback?desktop_auth_nonce=wrong-nonce&code=wrong"
      );
      deepLinkSubject.next(
        `com.fuzzywaddle.probablewaffle://auth/callback?desktop_auth_nonce=${nonce}&code=test`
      );
    });

    await service.signInWithGoogle();

    if (!oauthRedirectUrl) throw new Error("OAuth redirect URL was not captured");
    const parsedOAuthRedirectUrl = new URL(oauthRedirectUrl);
    expect(parsedOAuthRedirectUrl.origin).toBe(window.location.origin);
    expect(parsedOAuthRedirectUrl.pathname).toBe("/assets/auth-callback.html");
    expect(desktopAuthBridge.initDeepLinkListener).toHaveBeenCalled();
    expect(desktopAuthBridge.openInBrowser).toHaveBeenCalledWith("https://accounts.google.com/oauth");
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("test");
    expect(desktopAuthBridge.initDeepLinkListener.mock.invocationCallOrder[0]).toBeLessThan(
      desktopAuthBridge.openInBrowser.mock.invocationCallOrder[0]
    );
  });

  it("stops immediately when the system browser cannot be opened", async () => {
    const openerError = new Error("opener failed");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    desktopAuthBridge.openInBrowser.mockRejectedValue(openerError);

    await service.signInWithGoogle();

    expect(service.processing).toBeNull();
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith("[AuthService] Tauri sign-in failed:", openerError);
  });

  it("cancels an active desktop sign-in and restores its idle state", async () => {
    let browserOpenedResolve: (() => void) | undefined;
    const browserOpened = new Promise<void>((resolve) => {
      browserOpenedResolve = resolve;
    });
    desktopAuthBridge.openInBrowser.mockImplementation(async () => {
      browserOpenedResolve?.();
    });

    const signInPromise = service.signInWithGoogle();
    await browserOpened;

    expect(service.isDesktopSignInPending()).toBe(true);
    service.cancelSignIn();
    await signInPromise;

    expect(service.isDesktopSignInPending()).toBe(false);
    expect(service.processing).toBeNull();
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
  });

  it("stops waiting when no OAuth callback arrives", async () => {
    jest.useFakeTimers();
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    let browserOpenedResolve: (() => void) | undefined;
    const browserOpened = new Promise<void>((resolve) => {
      browserOpenedResolve = resolve;
    });
    desktopAuthBridge.openInBrowser.mockImplementation(async () => {
      browserOpenedResolve?.();
    });

    try {
      const signInPromise = service.signInWithGoogle();
      await browserOpened;
      await jest.advanceTimersByTimeAsync(120_000);
      await signInPromise;

      expect(service.processing).toBeNull();
      expect(consoleError).toHaveBeenCalledWith("[AuthService] Tauri sign-in failed:", expect.anything());
    } finally {
      jest.useRealTimers();
    }
  });

  it("accepts implicit tokens only when the callback nonce matches", async () => {
    desktopAuthBridge.openInBrowser.mockImplementation(async () => {
      if (!oauthRedirectUrl) throw new Error("OAuth redirect URL was not captured");
      const nonce = new URL(oauthRedirectUrl).searchParams.get("desktop_auth_nonce");
      if (!nonce) throw new Error("OAuth redirect URL did not contain a nonce");

      deepLinkSubject.next(
        `com.fuzzywaddle.probablewaffle://auth/callback?desktop_auth_nonce=${nonce}` +
          "&access_token=access&refresh_token=refresh"
      );
    });

    await service.signInWithGoogle();

    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh"
    });
  });
});
