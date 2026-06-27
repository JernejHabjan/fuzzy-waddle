import type { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";
import { from, switchMap } from "rxjs";

export const authReadyInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (!req.url.startsWith(environment.api)) {
    return next(req);
  }

  return from(authService.ensureAuthReady()).pipe(switchMap(() => next(req)));
};
