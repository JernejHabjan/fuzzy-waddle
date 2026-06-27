import { AuthService } from "./auth.service";
import type { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { inject } from "@angular/core";

export const accessTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (!req.url.startsWith(environment.api)) {
    return next(req);
  }

  const accessToken = authService.accessToken;

  if (!accessToken) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  );
};
