import { inject, Injectable, type OnDestroy } from "@angular/core";
import { type Session } from "@supabase/supabase-js";
import { DataAccessService } from "../data-access.service";
import { type AuthServiceInterface } from "./auth.service.interface";
import { BehaviorSubject, type Observable, type Subscription } from "rxjs";
import { environment } from "@fuzzy-waddle/environments/environment";
import { DESKTOP_AUTH_BRIDGE } from "./desktop-auth-bridge";

/** Deep-link scheme registered in tauri.conf.json → plugins.deep-link.desktop.schemes */
const TAURI_DEEP_LINK_SCHEME = "com.fuzzywaddle.probablewaffle";

/**
 * OAuth redirect target for the Tauri flow.
 *
 * Points to a plain static HTML file (not Angular) so Supabase's `detectSessionInUrl`
 * cannot auto-establish a session in the browser tab.  The HTML page forwards the
 * tokens to the registered app scheme and then closes itself.
 *
 * In dev the Angular dev server serves the file from /assets/.
 * In prod the file is bundled into the Render deploy at the same path.
 */
function tauriAuthRedirect(): string {
  // In `pnpm tauri:dev` the WebView loads the Angular dev server at localhost:4200.
  // In a production Tauri build the origin is tauri://localhost or http://tauri.localhost.
  // Check the actual runtime origin rather than isDevMode() (a compile-time constant).
  const base = window.location.origin.includes("localhost") ? window.location.origin : environment.clientUrl;
  return `${base}/assets/auth-callback.html`;
}

@Injectable({
  providedIn: "root"
})
export class AuthService implements AuthServiceInterface, OnDestroy {
  processing: Promise<unknown> | null = null;

  private readonly dataAccessService = inject(DataAccessService);
  private readonly desktopAuthBridge = inject(DESKTOP_AUTH_BRIDGE, { optional: true });
  private readonly tauriSubscription?: Subscription;

  private _session: Session | null = null;
  private readonly sessionChangesSubject = new BehaviorSubject<Session | null>(null);
  /** Emits after each local authentication transition so offline feature queues can resume safely. */
  readonly sessionChanges: Observable<Session | null> = this.sessionChangesSubject.asObservable();

  constructor() {
    // In Tauri, listen for deep-link callbacks to complete the OAuth PKCE flow.
    // The OS fires the deep-link after Google redirects back to the registered scheme.
    this.tauriSubscription = this.desktopAuthBridge?.deepLink$.subscribe((url) => {
      // noinspection JSIgnoredPromiseFromCall
      this.handleDeepLinkAuthCallback(url);
    });
  }

  get session() {
    return this._session;
  }

  get fullName(): string | null {
    return (
      this.session?.user?.identities?.find((identity) => identity.provider === "google")?.identity_data?.[
        "full_name"
      ] ?? null
    );
  }

  get accessToken(): string | null {
    return this.session?.access_token ?? null;
  }

  get userId(): string | null {
    return this.session?.user?.id ?? null;
  }

  get isAuthenticated() {
    return this._session !== null;
  }

  async signInWithGoogle() {
    if (this.desktopAuthBridge?.isDesktop) {
      await this.signInWithGoogleTauri();
      return;
    }

    const signInPromise = (this.processing = this.dataAccessService.supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href }
    }));

    const { error } = await signInPromise;
    if (error) {
      console.error("error", error);
    }
    this.processing = null;
  }

  /**
   * Tauri OAuth flow (implicit) via deep link.
   *
   * 1. Ask Supabase for the Google auth URL (skipBrowserRedirect prevents the WebView
   *    from navigating to the OAuth page itself).
   * 2. Open the URL in the system browser via tauri-plugin-opener.
   * 3. After the user authenticates, Google → Supabase → browser lands on
   *    `/assets/auth-callback.html` (plain HTML, no Angular/Supabase) which:
   *      a. Redirects to `com.fuzzywaddle.probablewaffle://auth/callback#tokens`
   *      b. Attempts `window.close()` to shut the tab; falls back to a close button.
   * 4. OS triggers the registered deep-link → the desktop bridge emits the URL.
   * 5. `handleDeepLinkAuthCallback` calls `setSession()` with the implicit-flow tokens.
   */
  private async signInWithGoogleTauri() {
    this.processing = (async () => {
      const { data, error } = await this.dataAccessService.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: tauriAuthRedirect(),
          skipBrowserRedirect: true
        }
      });

      if (error) {
        console.error("[AuthService] signInWithOAuth error:", error);
        return;
      }

      if (data?.url) {
        await this.desktopAuthBridge?.openInBrowser(data.url);
      }
    })();

    await this.processing;
    this.processing = null;
  }

  /**
   * Completes the OAuth flow received via deep link.
   *
   * Supabase may return either:
   *  - Implicit flow: `...#access_token=<token>&refresh_token=<token>` → set session directly
   *  - PKCE flow:     `...?code=<auth_code>` → exchange with exchangeCodeForSession
   *
   * Google OAuth via Supabase typically uses the implicit flow, so both paths are handled.
   */
  private async handleDeepLinkAuthCallback(callbackUrl: string) {
    console.log("[AuthService] handleDeepLinkAuthCallback:", callbackUrl);
    if (!callbackUrl.startsWith(TAURI_DEEP_LINK_SCHEME)) {
      console.warn("[AuthService] URL did not match scheme, ignoring:", callbackUrl);
      return;
    }

    try {
      const parsedCallbackUrl = new URL(callbackUrl);
      const queryParams = parsedCallbackUrl.searchParams;
      const hashParams = new URLSearchParams(parsedCallbackUrl.hash.slice(1));
      const callbackError = queryParams.get("error") ?? hashParams.get("error");
      const callbackErrorDescription = queryParams.get("error_description") ?? hashParams.get("error_description");

      if (callbackError) {
        console.error("[AuthService] OAuth callback returned an error:", callbackError, callbackErrorDescription ?? "");
        return;
      }

      // Implicit flow: tokens arrive in the URL hash fragment
      const accessToken = queryParams.get("access_token") ?? hashParams.get("access_token");
      const refreshToken = queryParams.get("refresh_token") ?? hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { data, error } = await this.dataAccessService.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) {
          console.error("[AuthService] setSession error:", error);
          return;
        }
        console.log("[AuthService] session established (implicit):", data.session?.user?.email);
        this.updateSession(data.session);
        return;
      }

      // PKCE flow: auth code arrives as a query parameter
      const authCode = queryParams.get("code");
      if (!authCode) {
        console.warn("[AuthService] Callback URL did not contain auth tokens or code.");
        return;
      }

      const { data, error } = await this.dataAccessService.supabase.auth.exchangeCodeForSession(authCode);
      if (error) {
        console.error("[AuthService] exchangeCodeForSession error:", error);
        return;
      }
      console.log("[AuthService] session established (pkce):", data.session?.user?.email);
      this.updateSession(data.session);
    } catch (err) {
      console.error("[AuthService] deep-link auth callback failed:", err);
    }
  }

  async signOut() {
    const signOutPromise = (this.processing = this.dataAccessService.supabase.auth.signOut());
    const { error } = await signOutPromise;
    if (error) {
      console.error("error", error);
    } else {
      this.updateSession(null);
    }
    this.processing = null;
  }

  async autoSignIn(): Promise<Session | null> {
    const signInPromise = (this.processing = this.dataAccessService.supabase.auth.getSession());
    const { data, error } = await signInPromise;

    if (error) {
      console.error("error", error);
    }
    this.updateSession(data.session);
    this.processing = null;
    return data.session;
  }

  async ensureAuthReady(): Promise<Session | null> {
    if (this.processing) {
      await this.processing;
      return this._session;
    }

    if (!this.isAuthenticated) {
      return this.autoSignIn();
    }

    return this._session;
  }

  ngOnDestroy(): void {
    this.tauriSubscription?.unsubscribe();
  }

  /** Keeps the session getter and reactive consumers in lockstep after every auth path. */
  private updateSession(session: Session | null): void {
    this._session = session;
    this.sessionChangesSubject.next(session);
  }
}
