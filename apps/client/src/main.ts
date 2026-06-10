/// <reference types="@angular/localize" />

import { enableProdMode, importProvidersFrom, isDevMode, provideZoneChangeDetection } from "@angular/core";
import { isTauri } from "./app/shared/utils/tauri";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";

import { environment } from "./environments/environment";
import { AppComponent } from "./app/app.component";
import { SocketIoModule } from "ngx-socket-io";
import { ServiceWorkerModule } from "@angular/service-worker";
import { AppRoutingModule } from "./app/app-routing.module";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";
import { GameInstanceIndexeddbStorageService } from "./app/probable-waffle/communicators/storage/game-instance-indexeddb-storage.service";
import { GameInstanceStorageServiceInterface } from "./app/probable-waffle/communicators/storage/game-instance-storage.service.interface";
import { accessTokenInterceptor } from "./app/auth/access-token.interceptor";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { AuthGuard } from "./app/auth/auth.guard";
import Phaser from "phaser";
import { authReadyInterceptor } from "./app/auth/auth-ready.interceptor";

Object.assign(window, { Phaser });

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(
      BrowserModule,
      // app routing module must be included last, as it contains the wildcard route
      AppRoutingModule,
      ServiceWorkerModule.register("ngsw-worker.js", {
        // Disable in dev mode and in Tauri — Tauri has no web server to serve
        // ngsw-worker.js from, so registration would always 404.
        enabled: !isDevMode() && !isTauri(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: "registerWhenStable:30000"
      }),
      SocketIoModule.forRoot(environment.socketIoConfig)
    ),
    AuthGuard,
    { provide: GameInstanceStorageServiceInterface, useClass: GameInstanceIndexeddbStorageService },
    provideHttpClient(withInterceptors([authReadyInterceptor, accessTokenInterceptor])),
    provideCharts(withDefaultRegisterables())
  ]
}).catch((err) => console.error(err));
