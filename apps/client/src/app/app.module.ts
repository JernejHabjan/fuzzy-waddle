import { isDevMode, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { ServiceWorkerModule } from "@angular/service-worker";
import { AuthGuard } from "./auth/auth.guard";
import { SocketIoModule } from "ngx-socket-io";
import { environment } from "../environments/environment";
import { AccessTokenInterceptor } from "./auth/access-token.interceptor";
import { SwRefreshComponent } from "./shared/components/sw-refresh/sw-refresh.component";
import { GameInstanceIndexeddbStorageService } from "./probable-waffle/communicators/storage/game-instance-indexeddb-storage.service";
import { GameInstanceStorageServiceInterface } from "./probable-waffle/communicators/storage/game-instance-storage.service.interface";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    // app routing module must be included last, as it contains the wildcard route
    AppRoutingModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000"
    }),
    SocketIoModule.forRoot(environment.socketIoConfig),
    SwRefreshComponent
  ],
  providers: [
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AccessTokenInterceptor, multi: true },
    { provide: GameInstanceStorageServiceInterface, useClass: GameInstanceIndexeddbStorageService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
