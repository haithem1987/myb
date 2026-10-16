import { Routes } from '@angular/router';
import { COPROPERTY_ROUTES as LIB_COPROPERTY_ROUTES } from '@myb-front/coproperty-module';

export const COPROPERTY_ROUTES: Routes = LIB_COPROPERTY_ROUTES.map(route => {
  if (route.path === ':copropertyId/syndic') {
    return {
      ...route,
      children: [
        ...(route.children ?? []),
        {
          path: 'communication',
          loadComponent: () =>
            import('../communication/communication-hub.component').then(
              m => m.CommunicationHubComponent
            ),
        },
      ],
    };
  }
  return route;
});
