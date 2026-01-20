import { Routes } from '@angular/router';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';

export const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyComponent,
    children: [
      {
        path: '',
        component: CopropertyDashboardComponent,
      },
      {
        path: 'coproperties',
        component: CopropertyListComponent,
      },
      {
        path: 'coproperties/:id',
        component: CopropertyDetailComponent,
      },
      {
        path: 'coproperties/:id/edit',
        component: CopropertyDetailComponent,
      },
    ],
  },
];
