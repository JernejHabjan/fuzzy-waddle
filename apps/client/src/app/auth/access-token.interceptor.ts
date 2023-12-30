import { inject, Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AccessTokenInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let _request = request;
    const accessToken = this.authService.accessToken;
    if (accessToken) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`
      });
      _request = request.clone({ headers });
    }
    return next.handle(_request);
  }
}
