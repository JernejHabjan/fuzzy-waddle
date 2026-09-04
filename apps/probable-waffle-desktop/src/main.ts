/// <reference types="@angular/localize" />

import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";
import { provideRouter, type Routes, withComponentInputBinding } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "@fuzzy-waddle/environments/environment";
import { probableWaffleRoutes } from "@fuzzy-waddle/probable-waffle-interface/probable-waffle.routes";
import { SocketIoModule } from "ngx-socket-io";
import { accessTokenInterceptor } from "@fuzzy-waddle/platform-identity/client/auth/access-token.interceptor";
import { AuthGuard } from "@fuzzy-waddle/platform-identity/client/auth/auth.guard";
import { authReadyInterceptor } from "@fuzzy-waddle/platform-identity/client/auth/auth-ready.interceptor";
import { DESKTOP_AUTH_BRIDGE } from "@fuzzy-waddle/platform-identity/client/auth/desktop-auth-bridge";
import { TauriService } from "@fuzzy-waddle/platform-game-host/angular/services/tauri.service";
import { AppComponent } from "./app/app.component";

const routes = [
  { path: "", pathMatch: "full", redirectTo: "aota" },
  ...probableWaffleRoutes,
  { path: "**", redirectTo: "aota" }
] satisfies Routes;

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(
      BrowserModule,
      ServiceWorkerModule.register("ngsw-worker.js", { enabled: false }),
      SocketIoModule.forRoot(environment.socketIoConfig)
    ),
    AuthGuard,
    { provide: DESKTOP_AUTH_BRIDGE, useExisting: TauriService },
    provideHttpClient(withInterceptors([authReadyInterceptor, accessTokenInterceptor]))
  ]
}).catch((err) => console.error(err));
