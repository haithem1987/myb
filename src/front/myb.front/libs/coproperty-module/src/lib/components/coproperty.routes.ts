import { Routes } from '@angular/router';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';
import { OwnerDashboardComponent } from './owner-portal/owner-dashboard.component';
import { CopropertyNewComponent } from './coproperty-new/coproperty-new.component';
import { FundCallsListComponent } from './fund-calls-list/fund-calls-list.component';
import { FundCallNewComponent } from './fund-call-new/fund-call-new.component';
import { profileGuard } from '../guards/profile.guard';

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
      {
        path: 'fund-calls',
        component: FundCallsListComponent,
      },
      {
        path: 'fund-calls/new',
        component: FundCallNewComponent,
      },
      {
        path: 'fund-calls/:id',
        component: FundCallNewComponent,
      },
      {
        path: 'fund-calls/:id/edit',
        component: FundCallNewComponent,
      },
      // Owner Portal Routes — protected: requires completed owner profile
      {
        path: 'owner',
        canActivate: [profileGuard],
        component: OwnerDashboardComponent,
      },
    ],
  },
];
