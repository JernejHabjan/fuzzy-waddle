import { inject, Injectable } from "@angular/core";
import { type Session } from "@supabase/supabase-js";
import { DataAccessService } from "../data-access/data-access.service";
import { type AuthServiceInterface } from "./auth.service.interface";
import { isTauri, TauriService } from "../shared/services/tauri.service";

/** Deep-link scheme registered in tauri.conf.json → plugins.deep-link.desktop.schemes */
const TAURI_DEEP_LINK_SCHEME = "com.fuzzywaddle.probablewaffle";
const TAURI_AUTH_REDIRECT = `${TAURI_DEEP_LINK_SCHEME}://auth/callback`;

@Injectable({
  providedIn: "root"
})
export class AuthService implements AuthServiceInterface {
  processing: Promise<unknown> | null = null;

  private readonly dataAccessService = inject(DataAccessService);
  private readonly tauriService = inject(TauriService);

  private _session: Session | null = null;

  constructor() {
    // In Tauri, listen for deep-link callbacks to complete the OAuth PKCE flow.
    // The OS fires the deep-link after Google redirects back to the registered scheme.
    this.tauriService.deepLink$.subscribe((url) => {
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
    if (isTauri()) {
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
   * 3. After the user authenticates, Google → Supabase → OS triggers the registered
   *    deep-link scheme, which fires `TauriService.deepLink$`.
   * 4. `handleDeepLinkAuthCallback` calls `setSession()` with the implicit-flow tokens.
   */
  private async signInWithGoogleTauri() {
    this.processing = (async () => {
      const { data, error } = await this.dataAccessService.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: TAURI_AUTH_REDIRECT,
          skipBrowserRedirect: true
        }
      });

      if (error) {
        console.error("[AuthService] signInWithOAuth error:", error);
        return;
      }

      if (data?.url) {
        await this.tauriService.openInBrowser(data.url);
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
      // Implicit flow: tokens arrive in the URL hash fragment
      const hashIndex = callbackUrl.indexOf("#");
      if (hashIndex !== -1) {
        const params = new URLSearchParams(callbackUrl.slice(hashIndex + 1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
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
          this._session = data.session;
          return;
        }
      }

      // PKCE flow: auth code arrives as a query parameter
      const { data, error } = await this.dataAccessService.supabase.auth.exchangeCodeForSession(callbackUrl);
      if (error) {
        console.error("[AuthService] exchangeCodeForSession error:", error);
        return;
      }
      console.log("[AuthService] session established (pkce):", data.session?.user?.email);
      this._session = data.session;
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
      this._session = null;
    }
    this.processing = null;
  }

  async autoSignIn(): Promise<Session | null> {
    const signInPromise = (this.processing = this.dataAccessService.supabase.auth.getSession());
    const { data, error } = await signInPromise;

    if (error) {
      console.error("error", error);
    }
    this._session = data.session;
    this.processing = null;
    return data.session;
  }
}
