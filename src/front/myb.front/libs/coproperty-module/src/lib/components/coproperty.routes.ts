import { Routes, UrlMatcher, UrlSegment } from '@angular/router';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';
import { CopropertyNewComponent } from './coproperty-new/coproperty-new.component';
import { ChargesListComponent } from './charges-list/charges-list.component';
import { BudgetNewComponent } from './budget-new/budget-new.component';
import { MaintenanceListComponent } from './maintenance-list/maintenance-list.component';
import { InterventionListComponent } from './intervention-list/intervention-list.component';
import { InterventionNewComponent } from './intervention-new/intervention-new.component';
import { UnitsListComponent } from './units-list/units-list.component';
import { OwnerManagementComponent } from './owner-management/owner-management.component';
import { TenantManagementComponent } from './tenant-management/tenant-management.component';
import { FundCallsListComponent } from './fund-calls-list/fund-calls-list.component';
import { FundCallNewComponent } from './fund-call-new/fund-call-new.component';
import { ChargePaymentsComponent } from './charge-payments/charge-payments.component';
import { TreasuryDetailComponent } from './treasury-detail/treasury-detail.component';
import { UnpaidPaymentsComponent } from './unpaid-payments/unpaid-payments.component';
import { OwnerLayoutComponent } from './owner-portal/owner-layout/owner-layout.component';
import { OwnerDashboardComponent } from './owner-portal/owner-dashboard.component';
import { OwnerMyUnitsComponent } from './owner-portal/my-units/my-units.component';
import { OwnerInvoicesComponent } from './owner-portal/invoices/invoices.component';
import { OwnerChargesComponent } from './owner-portal/charges/charges.component';
import { OwnerMaintenanceComponent } from './owner-portal/maintenance/maintenance.component';
import { OwnerDocumentsComponent } from './owner-portal/documents/documents.component';
import { OwnerGeneralAssemblyComponent } from './owner-portal/general-assembly/general-assembly.component';
import { OwnerSignalementsComponent } from './owner-portal/signalements/owner-signalements.component';
import { NouveauSignalementComponent } from './owner-portal/signalements/nouveau-signalement/nouveau-signalement.component';
import { SyndicLayoutComponent } from './syndic-layout/syndic-layout.component';
import { SyndicDashboardComponent } from './syndic-dashboard/syndic-dashboard.component';
import { SyndicSignalementsComponent } from './syndic-signalements/syndic-signalements.component';
import { DiscussionsComponent } from './discussions/discussions.component';
import { GeneralAssemblyComponent } from './general-assembly/general-assembly.component';
import { ReportsComponent } from './reports/reports.component';
import { SyndicSettingsComponent } from './syndic-settings/settings.component';
import { authGuard } from '@myb-front/auth';
import { profileGuard } from '../guards/profile.guard';
import { copropertyRedirectGuard } from './coproperty-redirect.guard';

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
    pathMatch: 'full',
    canActivate: [copropertyRedirectGuard],
    children: [],
  },
  {
    path: 'syndic',
    component: SyndicLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['coproperty-syndic', 'coproperty-admin', 'system-admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SyndicDashboardComponent },
      { path: 'coproperties', component: CopropertyListComponent },
      { path: 'coproperties/new', component: CopropertyNewComponent },
      { path: 'coproperties/:id/edit', component: CopropertyNewComponent },
      { path: 'coproperties/:id', component: CopropertyDetailComponent },
      { path: 'budgets', component: ChargesListComponent },
      { path: 'budgets/new', component: BudgetNewComponent },
      { path: 'budgets/:id', component: BudgetNewComponent },
      { path: 'budgets/:id/edit', component: BudgetNewComponent },
      { path: 'charges', redirectTo: 'budgets', pathMatch: 'full' },
      { path: 'maintenance', component: MaintenanceListComponent },
      { path: 'interventions', component: InterventionListComponent },
      { path: 'interventions/new', component: InterventionNewComponent },
      { path: 'interventions/:id/edit', component: InterventionNewComponent },
      { path: 'signalements', component: SyndicSignalementsComponent },
      { path: 'discussions', component: DiscussionsComponent },
      { path: 'units', component: UnitsListComponent },
      { path: 'owners', component: OwnerManagementComponent },
      { path: 'tenants', component: TenantManagementComponent },
      { path: 'distribution', component: ChargesListComponent },
      { path: 'fund-calls', component: FundCallsListComponent },
      { path: 'fund-calls/new', component: FundCallNewComponent },
      { path: 'fund-calls/:id', component: FundCallNewComponent },
      { path: 'fund-calls/:id/edit', component: FundCallNewComponent },
      { path: 'charge-payments', component: ChargePaymentsComponent },
      { path: 'treasury', component: TreasuryDetailComponent },
      { path: 'unpaid-payments', component: UnpaidPaymentsComponent },
      { path: 'general-assembly', component: GeneralAssemblyComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: SyndicSettingsComponent },
    ],
  },
  {
    path: 'owner',
    component: OwnerLayoutComponent,
    canActivate: [authGuard, profileGuard],
    data: { roles: ['coproperty-owner', 'coproperty-syndic', 'coproperty-admin', 'system-admin', 'coproperty-tenant'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OwnerDashboardComponent },
      { path: 'my-units', component: OwnerMyUnitsComponent },
      { path: 'invoices', component: OwnerInvoicesComponent },
      { path: 'charges', component: OwnerChargesComponent },
      { path: 'maintenance', component: OwnerMaintenanceComponent },
      { path: 'documents', component: OwnerDocumentsComponent },
      { path: 'general-assembly', component: OwnerGeneralAssemblyComponent },
      { path: 'signalements', component: OwnerSignalementsComponent },
      { path: 'signalements/nouveau', component: NouveauSignalementComponent },
      { path: 'discussions', component: DiscussionsComponent },
    ],
  },
  {
    path: 'council',
    component: SyndicLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['coproperty-council', 'coproperty-syndic', 'coproperty-admin', 'system-admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SyndicDashboardComponent },
    ],
  },
  {
    path: 'accountant',
    component: SyndicLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['coproperty-accountant', 'coproperty-syndic', 'coproperty-admin', 'system-admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SyndicDashboardComponent },
    ],
  },
  // Legacy/UUID matchers kept for backward compatibility with deep-linked
  // coproperty detail pages: `/coproperty/:uuid` and `/coproperty/:uuid/edit`.
  // Order matters — they must come AFTER the named role subroutes above.
  {
    path: '',
    component: CopropertyComponent,
    children: [
      { matcher: uuidMatcher, component: CopropertyDetailComponent },
      { matcher: uuidEditMatcher, component: CopropertyNewComponent },
    ],
  },
];
