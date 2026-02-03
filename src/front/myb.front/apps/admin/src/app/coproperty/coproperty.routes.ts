import { Routes } from '@angular/router';
import { CopropertyRedirectComponent } from './coproperty-redirect.component';
import { SyndicLayoutComponent } from '../layouts/syndic-layout/syndic-layout.component';
import { OwnerLayoutComponent } from '../layouts/owner-layout/owner-layout.component';
import { CouncilLayoutComponent } from '../layouts/council-layout/council-layout.component';
import { AccountantLayoutComponent } from '../layouts/accountant-layout/accountant-layout.component';
import { SyndicDashboardComponent } from './syndic/syndic-dashboard/syndic-dashboard.component';
import { OwnerDashboardComponent } from './owner/owner-dashboard/owner-dashboard.component';

export const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyRedirectComponent,
  },
  {
    path: 'syndic',
    component: SyndicLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SyndicDashboardComponent,
      },
      {
        path: 'coproperties',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.CopropertyListComponent),
      },
      {
        path: 'coproperties/new',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.CopropertyNewComponent),
      },
      {
        path: 'coproperties/:id',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.CopropertyDetailComponent),
      },
      {
        path: 'charges',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.ChargeManagementComponent),
      },
      {
        path: 'maintenance',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.MaintenanceRequestsComponent),
      },
      {
        path: 'fund-calls',
        loadComponent: () => import('./syndic/fund-calls/fund-calls.component').then(m => m.FundCallsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./syndic/reports/reports.component').then(m => m.ReportsComponent),
      },
    ],
  },
  {
    path: 'owner',
    component: OwnerLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: OwnerDashboardComponent,
      },
    ],
  },
  {
    path: 'council',
    component: CouncilLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SyndicDashboardComponent,
      },
    ],
  },
  {
    path: 'accountant',
    component: AccountantLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SyndicDashboardComponent,
      },
    ],
  },
];
