import { inject, Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { type HttpEvent, HttpHandler, HttpHeaders, type HttpInterceptor, HttpRequest } from "@angular/common/http";
import { from, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class AccessTokenInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!request.url.startsWith(environment.api)) {
      return next.handle(request);
    }

    return from(this.authService.ensureAuthReady()).pipe(
      switchMap(() => {
        let authenticatedRequest = request;
        const accessToken = this.authService.accessToken;
        if (accessToken) {
          const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`
          });
          authenticatedRequest = request.clone({ headers });
        }

        return next.handle(authenticatedRequest);
      })
    );
  }
}
