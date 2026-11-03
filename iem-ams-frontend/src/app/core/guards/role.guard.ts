/**
 * src/app/core/guards/role.guard.ts
 *
 * Route guard that verifies the authenticated user has one of the allowed roles.
 * Configured in routes via: data: { roles: ['admin'] } or data: { roles: ['student'] }
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../shared/models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: UserRole[] = route.data?.['roles'] || [];
  const user = authService.currentUserValue;

  if (user && expectedRoles.includes(user.role)) {
    return true;
  }

  // Role not authorized -> redirect to appropriate dashboard or home
  if (user?.role === 'admin') {
    return router.createUrlTree(['/admin/dashboard']);
  } else if (user?.role === 'student') {
    return router.createUrlTree(['/student/dashboard']);
  }

  return router.createUrlTree(['/login']);
};

