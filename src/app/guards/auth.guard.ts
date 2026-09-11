import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authReady.pipe(
    filter(ready => ready),
    take(1),
    switchMap(() => authService.currentUser),
    map(user => {
      if (user) {
        return true;
      }

      void router.navigate(['/login']);
      return false;
    })
  );
};
