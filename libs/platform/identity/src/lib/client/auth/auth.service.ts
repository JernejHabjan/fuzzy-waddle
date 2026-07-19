import { inject, Injectable, signal } from "@angular/core";
import { type Session } from "@supabase/supabase-js";
import { DataAccessService } from "../data-access.service";
import { type AuthServiceInterface } from "./auth.service.interface";
import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  map,
  Subject,
  take,
  takeUntil,
  timeout,
  type Observable
} from "rxjs";
import { environment } from "@fuzzy-waddle/environments/environment";
import { DESKTOP_AUTH_BRIDGE } from "./desktop-auth-bridge";

/** Deep-link scheme registered in tauri.conf.json → plugins.deep-link.desktop.schemes */
const TAURI_DEEP_LINK_SCHEME = "com.fuzzywaddle.probablewaffle";
const TAURI_DEEP_LINK_PROTOCOL = `${TAURI_DEEP_LINK_SCHEME}:`;
const TAURI_AUTH_CALLBACK_HOST = "auth";
const TAURI_AUTH_CALLBACK_PATH = "/callback";
const TAURI_AUTH_NONCE_PARAM = "desktop_auth_nonce";
const TAURI_AUTH_CALLBACK_TIMEOUT_MS = 120_000;

interface DesktopSignInAttempt {
  readonly cancellation$: Subject<void>;
  cancelled: boolean;
  processing: Promise<void> | null;
}

/**
 * OAuth redirect target for the Tauri flow.
 *
 * Points to a plain static HTML file (not Angular) so Supabase's `detectSessionInUrl`
 * cannot auto-establish a session in the browser tab.  The HTML page forwards the
 * tokens to the registered app scheme and tells the user when the tab can be closed.
 *
 * In dev the Angular dev server serves the file from /assets/.
 * In prod the file is bundled into the Render deploy at the same path.
 */
function tauriAuthRedirect(nonce: string): string {
  // In `pnpm tauri:dev` the WebView loads the Angular dev server at localhost:4201.
  // In a production Tauri build the origin is tauri://localhost or http://tauri.localhost.
  // Check the actual runtime origin rather than isDevMode() (a compile-time constant).
  const base = window.location.origin.includes("localhost") ? window.location.origin : environment.clientUrl;
  const redirectUrl = new URL("/assets/auth-callback.html", base);
  redirectUrl.searchParams.set(TAURI_AUTH_NONCE_PARAM, nonce);
  return redirectUrl.toString();
}

/** Generates an unguessable identifier that binds a deep link to one OAuth attempt. */
function createTauriAuthNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Narrows an untrusted native deep link to the exact callback for the active OAuth attempt.
 *
 * Requiring both the registered URL shape and the per-attempt nonce prevents unrelated
 * protocol activations from consuming the one-shot callback subscription.
 */
function parseTauriAuthCallback(callbackUrl: string, expectedNonce: string): URL | null {
  try {
    const parsedCallbackUrl = new URL(callbackUrl);
    if (
      parsedCallbackUrl.protocol !== TAURI_DEEP_LINK_PROTOCOL ||
      parsedCallbackUrl.hostname !== TAURI_AUTH_CALLBACK_HOST ||
      parsedCallbackUrl.pathname !== TAURI_AUTH_CALLBACK_PATH ||
      parsedCallbackUrl.searchParams.get(TAURI_AUTH_NONCE_PARAM) !== expectedNonce
    ) {
      return null;
    }

    const hashParams = new URLSearchParams(parsedCallbackUrl.hash.slice(1));
    const hasError =
      parsedCallbackUrl.searchParams.has("error") || hashParams.has("error");
    const hasCode = parsedCallbackUrl.searchParams.has("code");
    const hasImplicitSession =
      (parsedCallbackUrl.searchParams.has("access_token") || hashParams.has("access_token")) &&
      (parsedCallbackUrl.searchParams.has("refresh_token") || hashParams.has("refresh_token"));

    return hasError || hasCode || hasImplicitSession ? parsedCallbackUrl : null;
  } catch {
    return null;
  }
}

@Injectable({
  providedIn: "root"
})
export class AuthService implements AuthServiceInterface {
  processing: Promise<unknown> | null = null;
  readonly isDesktopSignInPending = signal(false);

  private readonly dataAccessService = inject(DataAccessService);
  private readonly desktopAuthBridge = inject(DESKTOP_AUTH_BRIDGE, { optional: true });
  private desktopSignInAttempt: DesktopSignInAttempt | null = null;

  private _session: Session | null = null;
  private readonly sessionChangesSubject = new BehaviorSubject<Session | null>(null);
  /** Emits after each local authentication transition so offline feature queues can resume safely. */
  readonly sessionChanges: Observable<Session | null> = this.sessionChangesSubject.asObservable();

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
    if (this.processing) return;

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

  /** Cancels only the active desktop OAuth wait; an already-open system browser remains user-owned. */
  cancelSignIn(): void {
    const attempt = this.desktopSignInAttempt;
    if (!attempt) return;

    attempt.cancelled = true;
    attempt.cancellation$.next();
    attempt.cancellation$.complete();
    this.isDesktopSignInPending.set(false);
    if (this.processing === attempt.processing) {
      this.processing = null;
    }
  }

  /**
   * Tauri OAuth flow via deep link.
   *
   * 1. Ask Supabase for the Google auth URL (skipBrowserRedirect prevents the WebView
   *    from navigating to the OAuth page itself).
   * 2. Open the URL in the system browser via tauri-plugin-opener.
   * 3. After the user authenticates, Google → Supabase → browser lands on
   *    `/assets/auth-callback.html` (plain HTML, no Angular/Supabase) which:
   *      a. Redirects to `com.fuzzywaddle.probablewaffle://auth/callback#tokens`
   *      b. Displays a close-tab instruction in the browser.
   * 4. Subscribe before opening the browser and wait for the first matching deep-link URL.
   * 5. `handleDeepLinkAuthCallback` exchanges the PKCE code, with implicit tokens supported
   *    only as a compatibility fallback for an auth attempt started by an older client.
   */
  private async signInWithGoogleTauri() {
    const attempt: DesktopSignInAttempt = {
      cancellation$: new Subject<void>(),
      cancelled: false,
      processing: null
    };
    this.desktopSignInAttempt = attempt;
    this.isDesktopSignInPending.set(true);

    const signInPromise = (async () => {
      const desktopAuthBridge = this.desktopAuthBridge;
      if (!desktopAuthBridge) return;

      // Listener setup belongs to the OAuth operation so startup remains independent
      // of native deep-link initialization and fast browser callbacks are not missed.
      await desktopAuthBridge.initDeepLinkListener();
      if (attempt.cancelled) return;

      const authNonce = createTauriAuthNonce();

      const { data, error } = await this.dataAccessService.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: tauriAuthRedirect(authNonce),
          skipBrowserRedirect: true
        }
      });
      if (attempt.cancelled) return;

      if (error) {
        console.error("[AuthService] signInWithOAuth error:", error);
        return;
      }

      if (data?.url) {
        const callbackPromise = firstValueFrom(
          desktopAuthBridge.deepLink$.pipe(
            map((url) => parseTauriAuthCallback(url, authNonce)),
            filter((url): url is URL => url !== null),
            take(1),
            takeUntil(attempt.cancellation$),
            timeout({ first: TAURI_AUTH_CALLBACK_TIMEOUT_MS })
          )
        );

        // Mark the promise as handled while the native opener is still in flight.
        void callbackPromise.catch(() => undefined);
        try {
          await desktopAuthBridge.openInBrowser(data.url);
          const parsedCallbackUrl = await callbackPromise;
          if (attempt.cancelled) return;

          await this.handleDeepLinkAuthCallback(parsedCallbackUrl);
        } finally {
          // Opening failures must cancel the pending timeout/subscription immediately.
          attempt.cancellation$.next();
          attempt.cancellation$.complete();
        }
      }
    })();
    attempt.processing = signInPromise;
    this.processing = signInPromise;

    try {
      await signInPromise;
    } catch (err) {
      if (!attempt.cancelled) {
        console.error("[AuthService] Tauri sign-in failed:", err);
      }
    } finally {
      if (this.desktopSignInAttempt === attempt) {
        this.desktopSignInAttempt = null;
        this.isDesktopSignInPending.set(false);
      }
      if (this.processing === signInPromise) {
        this.processing = null;
      }
    }
  }

  /**
   * Completes the OAuth flow received via deep link.
   *
   * Supabase returns either:
   *  - PKCE flow: `...?code=<auth_code>` → exchange with exchangeCodeForSession
   *  - Legacy implicit flow: `...#access_token=<token>&refresh_token=<token>` → set session directly
   *
   * New clients request PKCE; implicit handling lets an auth attempt survive an app update.
   */
  private async handleDeepLinkAuthCallback(parsedCallbackUrl: URL) {
    console.log("[AuthService] processing deep-link auth callback");
    try {
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
        console.log("[AuthService] session established (implicit)");
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
      console.log("[AuthService] session established (pkce)");
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

  /** Keeps the session getter and reactive consumers in lockstep after every auth path. */
  private updateSession(session: Session | null): void {
    this._session = session;
    this.sessionChangesSubject.next(session);
  }
}
