import { Routes } from '@angular/router';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';
import { OwnerDashboardComponent } from './owner-portal/owner-dashboard.component';
import { CopropertyNewComponent } from './coproperty-new/coproperty-new.component';

export const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyComponent,
    children: [
      // Admin/Syndic Routes
      {
        path: '',
        component: CopropertyDashboardComponent,
      },
      {
        path: 'list',
        component: CopropertyListComponent,
      },
      {
        path: 'new',
        component: CopropertyNewComponent,
      },
      {
        path: ':id',
        component: CopropertyDetailComponent,
      },
      {
        path: ':id/edit',
        component: CopropertyNewComponent,
      },
      // Owner Portal Routes
      {
        path: 'owner',
        component: OwnerDashboardComponent,
      },
    ],
  },
];
