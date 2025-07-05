/// <reference types="@angular/localize" />

import { enableProdMode, importProvidersFrom, isDevMode } from "@angular/core";

import { environment } from "./environments/environment";
import { AppComponent } from "./app/app.component";
import { SocketIoModule } from "ngx-socket-io";
import { ServiceWorkerModule } from "@angular/service-worker";
import { AppRoutingModule } from "./app/app-routing.module";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";
import { GameInstanceIndexeddbStorageService } from "./app/probable-waffle/communicators/storage/game-instance-indexeddb-storage.service";
import { GameInstanceStorageServiceInterface } from "./app/probable-waffle/communicators/storage/game-instance-storage.service.interface";
import { AccessTokenInterceptor } from "./app/auth/access-token.interceptor";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { AuthGuard } from "./app/auth/auth.guard";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      // app routing module must be included last, as it contains the wildcard route
      AppRoutingModule,
      ServiceWorkerModule.register("ngsw-worker.js", {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: "registerWhenStable:30000"
      }),
      SocketIoModule.forRoot(environment.socketIoConfig)
    ),
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AccessTokenInterceptor, multi: true },
    { provide: GameInstanceStorageServiceInterface, useClass: GameInstanceIndexeddbStorageService },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync()
  ]
}).catch((err) => console.error(err));
