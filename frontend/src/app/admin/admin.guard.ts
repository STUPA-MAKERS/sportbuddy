import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminApiService } from './admin-api.service';

/** The admin area needs a moderator session; without one it shows the login page. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const api = inject(AdminApiService);
  const router = inject(Router);
  if (api.user()) return true;
  return api.me().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/admin/anmelden'], { queryParams: { returnTo: state.url } }))),
  );
};
