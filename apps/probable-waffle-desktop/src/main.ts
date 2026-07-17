/// <reference types="@angular/localize" />

import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";
import { provideRouter, type Routes, withComponentInputBinding } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "@fuzzy-waddle/environments/environment";
import { probableWaffleRoutes } from "@fuzzy-waddle/probable-waffle-interface";
import { SocketIoModule } from "ngx-socket-io";
import { accessTokenInterceptor } from "@fuzzy-waddle/portal/auth/access-token.interceptor";
import { AppComponent } from "@fuzzy-waddle/portal/app.component";
import { AuthGuard } from "@fuzzy-waddle/portal/auth/auth.guard";
import { authReadyInterceptor } from "@fuzzy-waddle/portal/auth/auth-ready.interceptor";

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
    provideHttpClient(withInterceptors([authReadyInterceptor, accessTokenInterceptor]))
  ]
}).catch((err) => console.error(err));
