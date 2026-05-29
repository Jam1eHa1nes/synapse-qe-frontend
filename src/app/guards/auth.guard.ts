import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // We await the session check to ensure state is hydrated before navigating
  await authService.checkSession();

  if (authService.user()) {
    return true;
  }

  return router.parseUrl('/login');
};
