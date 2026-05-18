import { Routes, UrlMatcher, UrlSegment } from '@angular/router';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';
import { CopropertyNewComponent } from './coproperty-new/coproperty-new.component';
import { FundCallsListComponent } from './fund-calls-list/fund-calls-list.component';
import { FundCallNewComponent } from './fund-call-new/fund-call-new.component';
import { TreasuryDetailComponent } from './treasury-detail/treasury-detail.component';
import { UnpaidPaymentsComponent } from './unpaid-payments/unpaid-payments.component';
import { OwnerLayoutComponent } from './owner-portal/owner-layout/owner-layout.component';
import { OwnerDashboardComponent } from './owner-portal/owner-dashboard.component';
import { profileGuard } from '../guards/profile.guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Matches a single path segment only when it is a valid UUID. */
const uuidMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  if (segments.length === 1 && UUID_REGEX.test(segments[0].path)) {
    return { consumed: segments, posParams: { id: segments[0] } };
  }
  return null;
};

/** Matches `:uuid/edit` — two segments where the first is a valid UUID. */
const uuidEditMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  if (segments.length === 2 && UUID_REGEX.test(segments[0].path) && segments[1].path === 'edit') {
    return { consumed: segments, posParams: { id: segments[0] } };
  }
  return null;
};

export const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyComponent,
    children: [
      // Syndic/Admin routes
      { path: '', component: CopropertyDashboardComponent },
      { path: 'list', component: CopropertyListComponent },
      { path: 'new', component: CopropertyNewComponent },
      { path: 'treasury', component: TreasuryDetailComponent },
      { path: 'unpaid-payments', component: UnpaidPaymentsComponent },
      { path: 'fund-calls', component: FundCallsListComponent },
      { path: 'fund-calls/new', component: FundCallNewComponent },
      { path: 'fund-calls/:id', component: FundCallNewComponent },
      { path: 'fund-calls/:id/edit', component: FundCallNewComponent },

      // Owner Portal — full space with layout nav and all sub-pages
      {
        path: 'owner',
        component: OwnerLayoutComponent,
        canActivate: [profileGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: OwnerDashboardComponent },
          {
            path: 'my-units',
            loadComponent: () =>
              import('./owner-portal/my-units/my-units.component').then(m => m.OwnerMyUnitsComponent),
          },
          {
            path: 'invoices',
            loadComponent: () =>
              import('./owner-portal/invoices/invoices.component').then(m => m.OwnerInvoicesComponent),
          },
          {
            path: 'charges',
            loadComponent: () =>
              import('./owner-portal/charges/charges.component').then(m => m.OwnerChargesComponent),
          },
          {
            path: 'maintenance',
            loadComponent: () =>
              import('./owner-portal/maintenance/maintenance.component').then(m => m.OwnerMaintenanceComponent),
          },
          {
            path: 'documents',
            loadComponent: () =>
              import('./owner-portal/documents/documents.component').then(m => m.OwnerDocumentsComponent),
          },
          {
            path: 'general-assembly',
            loadComponent: () =>
              import('./owner-portal/general-assembly/general-assembly.component').then(m => m.OwnerGeneralAssemblyComponent),
          },
        ],
      },

      // UUID-only matchers prevent non-UUID segments (e.g. 'owner') from being
      // treated as a coproperty ID.
      { matcher: uuidMatcher, component: CopropertyDetailComponent },
      { matcher: uuidEditMatcher, component: CopropertyNewComponent },
    ],
  },
];
