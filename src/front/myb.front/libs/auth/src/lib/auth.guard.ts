// import { Injectable } from '@angular/core';
// import {
//   CanActivate,
//   ActivatedRouteSnapshot,
//   RouterStateSnapshot,
//   UrlTree,
//   Router,
// } from '@angular/router';
// import { Observable } from 'rxjs';
// import { KeycloakService } from './keycloak.service';

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthGuard implements CanActivate {
//   constructor(
//     private router: Router,
//     private keycloakService: KeycloakService
//   ) {}

//   canActivate(
//     next: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ):
//     | Observable<boolean | UrlTree>
//     | Promise<boolean | UrlTree>
//     | boolean
//     | UrlTree {
//     if (this.keycloakService.isAuthenticated()) {
//       return true;
//     } else {
//       // Do not manually navigate within the guard. Instead, return a UrlTree.
//       return false;
//     }
//   }
// }
export const authGuard: CanActivateFn = (route, state) => {
  return inject(KeycloakService).isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/auth/login']);
};
