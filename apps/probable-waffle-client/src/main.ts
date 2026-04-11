/// <reference types="@angular/localize" />

import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from "@angular/core";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";

import { environment } from "./environments/environment";
import { AppComponent } from "./app/app.component";
import { SocketIoModule } from "ngx-socket-io";
import { AppRoutingModule } from "./app/app-routing.module";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";
import { GameInstanceIndexeddbStorageService } from "@fuzzy-waddle/client/app/probable-waffle/communicators/storage/game-instance-indexeddb-storage.service";
import { GameInstanceStorageServiceInterface } from "@fuzzy-waddle/client/app/probable-waffle/communicators/storage/game-instance-storage.service.interface";
import { AccessTokenInterceptor } from "@fuzzy-waddle/client/app/auth/access-token.interceptor";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { AuthGuard } from "@fuzzy-waddle/client/app/auth/auth.guard";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

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
      SocketIoModule.forRoot(environment.socketIoConfig)
    ),
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AccessTokenInterceptor, multi: true },
    { provide: GameInstanceStorageServiceInterface, useClass: GameInstanceIndexeddbStorageService },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables())
  ]
}).catch((err) => console.error(err));
