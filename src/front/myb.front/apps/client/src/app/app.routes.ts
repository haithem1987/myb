import { Route } from '@angular/router';
import { authGuard } from 'libs/auth/src/lib/auth.guard';
export const appRoutes: Route[] = [
  //   {path :'', loadComponent: ()=>import('@myb-front/auth').then((c)=>c.aut)},

  {
    path: 'timesheet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@myb-front/time-sheet-module').then(
        (c) => c.TimeSheetModuleComponent
      ),
  },
];
