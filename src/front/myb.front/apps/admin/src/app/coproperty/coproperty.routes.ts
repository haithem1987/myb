import { Routes } from '@angular/router';
import { CopropertyRedirectComponent } from './coproperty-redirect.component';
import { SyndicLayoutComponent } from '../layouts/syndic-layout/syndic-layout.component';
import { OwnerLayoutComponent } from '../layouts/owner-layout/owner-layout.component';
import { CouncilLayoutComponent } from '../layouts/council-layout/council-layout.component';
import { AccountantLayoutComponent } from '../layouts/accountant-layout/accountant-layout.component';
import { SyndicDashboardComponent } from './syndic/syndic-dashboard/syndic-dashboard.component';
import { OwnerDashboardComponent } from './owner/owner-dashboard/owner-dashboard.component';
import { authGuard } from 'libs/auth/src/lib/auth.guard';
import { profileGuard } from '@myb-front/coproperty-module';

export const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyRedirectComponent,
  },
  {
    path: 'syndic',
    component: SyndicLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['coproperty-syndic', 'coproperty-admin', 'system-admin'] },
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
        path: 'coproperties/:id/edit',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.CopropertyNewComponent),
      },
      {
        path: 'coproperties/:id',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.CopropertyDetailComponent),
      },
      {
        path: 'budgets',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.ChargesListComponent),
      },
      {
        path: 'budgets/new',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.BudgetNewComponent),
      },
      {
        path: 'budgets/:id',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.BudgetNewComponent),
      },
      {
        path: 'budgets/:id/edit',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.BudgetNewComponent),
      },
      {
        path: 'charges',
        redirectTo: 'budgets',
        pathMatch: 'full'
      },
      {
        path: 'maintenance',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.MaintenanceListComponent),
      },
      {
        path: 'interventions',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.InterventionListComponent),
      },
      {
        path: 'interventions/new',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.InterventionNewComponent),
      },
      {
        path: 'interventions/:id/edit',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.InterventionNewComponent),
      },
      {
        path: 'signalements',
        loadComponent: () => import('./syndic/signalements/syndic-signalements.component').then(m => m.SyndicSignalementsComponent),
      },
      {
        path: 'discussions',
        loadComponent: () => import('./discussions/discussions.component').then(m => m.DiscussionsComponent),
      },
      {
        path: 'units',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.UnitsListComponent),
      },
      {
        path: 'owners',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.OwnerManagementComponent),
      },
      {
        path: 'tenants',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.TenantManagementComponent),
      },
      {
        path: 'distribution',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.ChargesListComponent),
      },
      {
        path: 'fund-calls',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.FundCallsListComponent),
      },
      {
        path: 'fund-calls/new',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.FundCallNewComponent),
      },
      {
        path: 'fund-calls/:id',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.FundCallNewComponent),
      },
      {
        path: 'fund-calls/:id/edit',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.FundCallNewComponent),
      },
      {
        path: 'charge-payments',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.ChargePaymentsComponent),
      },
      {
        path: 'treasury',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.TreasuryDetailComponent),
      },
      {
        path: 'unpaid-payments',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.UnpaidPaymentsComponent),
      },
      {
        path: 'general-assembly',
        loadComponent: () => import('./syndic/general-assembly/general-assembly.component').then(m => m.GeneralAssemblyComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./syndic/reports/reports.component').then(m => m.ReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./syndic/settings/settings.component').then(m => m.SyndicSettingsComponent),
      },
    ],
  },
  {
    path: 'owner',
    component: OwnerLayoutComponent,
    canActivate: [authGuard, profileGuard],
    data: { roles: ['coproperty-owner', 'coproperty-syndic', 'coproperty-admin', 'system-admin', 'coproperty-tenant'] },
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
      {
        path: 'my-units',
        loadComponent: () => import('./owner/my-units/my-units.component').then(m => m.OwnerMyUnitsComponent),
      },
      {
        path: 'invoices',
        loadComponent: () => import('./owner/invoices/invoices.component').then(m => m.OwnerInvoicesComponent),
      },
      {
        path: 'charges',
        loadComponent: () => import('./owner/charges/charges.component').then(m => m.OwnerChargesComponent),
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./owner/maintenance/maintenance.component').then(m => m.OwnerMaintenanceComponent),
      },
      {
        path: 'documents',
        loadComponent: () => import('./owner/documents/documents.component').then(m => m.OwnerDocumentsComponent),
      },
      {
        path: 'general-assembly',
        loadComponent: () => import('./owner/general-assembly/general-assembly.component').then(m => m.OwnerGeneralAssemblyComponent),
      },
      {
        path: 'signalements',
        loadComponent: () => import('./owner/signalements/owner-signalements.component').then(m => m.OwnerSignalementsComponent),
      },
      {
        path: 'signalements/nouveau',
        loadComponent: () => import('@myb-front/coproperty-module').then(m => m.NouveauSignalementComponent),
      },
      {
        path: 'discussions',
        loadComponent: () => import('./discussions/discussions.component').then(m => m.DiscussionsComponent),
      },
    ],
  },
  {
    path: 'council',
    component: CouncilLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['coproperty-council', 'coproperty-syndic', 'coproperty-admin', 'system-admin'] },
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
    canActivate: [authGuard],
    data: { roles: ['coproperty-accountant', 'coproperty-syndic', 'coproperty-admin', 'system-admin'] },
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
