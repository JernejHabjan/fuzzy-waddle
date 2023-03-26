import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HomeModule } from './home/home.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthGuard } from './auth/auth.guard';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ComponentsModule } from './shared/components/components.module';
import { AccessTokenInterceptor } from './auth/access-token.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    HomeModule,
    // app routing module must be included last, as it contains the wildcard route
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    SocketIoModule.forRoot(environment.socketIoConfig),
    FontAwesomeModule,
    NgbModule,
    ComponentsModule
  ],
  providers: [AuthGuard, { provide: HTTP_INTERCEPTORS, useClass: AccessTokenInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
