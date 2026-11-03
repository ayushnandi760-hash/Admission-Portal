/**
 * src/app/core/guards/auth.guard.ts
 *
 * Route guard that ensures the user is authenticated before allowing access.
 * If not logged in, redirects to /login with the attempted returnUrl preserved in query parameters.
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Not logged in -> redirect to login with return url
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

