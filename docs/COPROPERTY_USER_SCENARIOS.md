# Scénarios Utilisateurs - Module Copropriété MYB

Guide complet des scénarios d'utilisation pour chaque rôle dans le module de gestion de copropriété.

---

## 👥 Rôles et Utilisateurs

### 1. **Syndic / Gestionnaire** (`coproperty-admin`, `coproperty-syndic`)
Gestionnaire professionnel de copropriétés avec accès complet à l'administration.

### 2. **Copropriétaire** (`coproperty-owner`)
Propriétaire d'un ou plusieurs lots dans une copropriété.

### 3. **Conseil Syndical** (`coproperty-council`)
Membre du conseil syndical avec accès en lecture et participation aux décisions.

### 4. **Comptable** (`coproperty-accountant`)
Comptable externe avec accès aux données financières.

### 5. **Administrateur Système** (`system-admin`)
Administrateur technique de la plateforme MYB.

---

## 🎨 Architecture Frontend - Gestion des Rôles

### Vue d'Ensemble de l'Architecture

```
src/front/myb.front/
├── apps/
│   └── admin/                          # App principale
│       └── src/app/
│           ├── layouts/                # Layouts par rôle
│           │   ├── syndic-layout/
│           │   ├── owner-layout/
│           │   ├── council-layout/
│           │   ├── accountant-layout/
│           │   └── admin-layout/
│           │
│           ├── guards/                 # Protection des routes
│           │   ├── role.guard.ts
│           │   ├── syndic.guard.ts
│           │   ├── owner.guard.ts
│           │   └── permissions.guard.ts
│           │
│           └── coproperty/
│               ├── syndic/             # Interface Syndic
│               ├── owner/              # Portail Copropriétaire
│               ├── council/            # Interface Conseil Syndical
│               ├── accountant/         # Interface Comptable
│               └── shared/             # Composants partagés
│
└── libs/
    └── coproperty-module/
        ├── services/
        │   ├── auth-role.service.ts   # Gestion des rôles
        │   └── permissions.service.ts  # Gestion des permissions
        └── models/
            └── user-role.models.ts     # Types de rôles
```

---

### 🔐 Système de Gestion des Rôles

#### 1. Service d'Authentification et Rôles

```typescript
// libs/coproperty-module/services/auth-role.service.ts

export enum CopropertyRole {
  SYNDIC = 'coproperty-syndic',
  OWNER = 'coproperty-owner',
  COUNCIL = 'coproperty-council',
  ACCOUNTANT = 'coproperty-accountant',
  ADMIN = 'system-admin'
}

export interface UserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: CopropertyRole[];
  permissions: string[];
  managedCoproperties?: string[];  // Pour syndic
  ownedUnits?: string[];           // Pour copropriétaire
}

@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  private currentUser = signal<UserWithRole | null>(null);
  
  // Vérification du rôle
  hasRole(role: CopropertyRole): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }
  
  // Vérification de permission
  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }
  
  // Rôle principal (pour routing)
  getPrimaryRole(): CopropertyRole | null {
    const roles = this.currentUser()?.roles ?? [];
    // Priorité: ADMIN > SYNDIC > COUNCIL > ACCOUNTANT > OWNER
    if (roles.includes(CopropertyRole.ADMIN)) return CopropertyRole.ADMIN;
    if (roles.includes(CopropertyRole.SYNDIC)) return CopropertyRole.SYNDIC;
    if (roles.includes(CopropertyRole.COUNCIL)) return CopropertyRole.COUNCIL;
    if (roles.includes(CopropertyRole.ACCOUNTANT)) return CopropertyRole.ACCOUNTANT;
    if (roles.includes(CopropertyRole.OWNER)) return CopropertyRole.OWNER;
    return null;
  }
  
  // Redirection selon rôle
  getDefaultRoute(): string {
    const role = this.getPrimaryRole();
    switch (role) {
      case CopropertyRole.SYNDIC:
        return '/coproperty/syndic/dashboard';
      case CopropertyRole.OWNER:
        return '/coproperty/owner/dashboard';
      case CopropertyRole.COUNCIL:
        return '/coproperty/council/dashboard';
      case CopropertyRole.ACCOUNTANT:
        return '/coproperty/accountant/dashboard';
      case CopropertyRole.ADMIN:
        return '/admin/system';
      default:
        return '/';
    }
  }
}
```

---

### 🛣️ Architecture de Routing par Rôle

```typescript
// coproperty/coproperty.routes.ts

export const COPROPERTY_ROUTES: Routes = [
  // Route racine - redirection selon rôle
  {
    path: '',
    canActivate: [AuthGuard],
    component: CopropertyRootComponent,
  },
  
  // ============================================================
  // SYNDIC / GESTIONNAIRE - Interface Complète
  // ============================================================
  {
    path: 'syndic',
    canActivate: [RoleGuard],
    data: { roles: [CopropertyRole.SYNDIC, CopropertyRole.ADMIN] },
    children: [
      {
        path: '',
        component: SyndicLayoutComponent,
        children: [
          {
            path: 'dashboard',
            component: SyndicDashboardComponent,
            data: { title: 'Tableau de Bord Syndic' }
          },
          {
            path: 'coproperties',
            children: [
              { path: '', component: CopropertyListComponent },
              { path: 'new', component: CopropertyNewComponent },
              { path: ':id', component: CopropertyDetailComponent },
              { path: ':id/edit', component: CopropertyEditComponent }
            ]
          },
          {
            path: 'charges',
            component: ChargeManagementComponent,
            data: { permission: 'charges:manage' }
          },
          {
            path: 'invoices',
            component: InvoiceManagementComponent,
            data: { permission: 'invoices:manage' }
          },
          {
            path: 'maintenance',
            component: MaintenanceManagementComponent
          },
          {
            path: 'fund-calls',
            component: FundCallManagementComponent
          },
          {
            path: 'reports',
            component: FinancialReportsComponent
          }
        ]
      }
    ]
  },
  
  // ============================================================
  // COPROPRIÉTAIRE - Portail Simplifié
  // ============================================================
  {
    path: 'owner',
    canActivate: [RoleGuard],
    data: { roles: [CopropertyRole.OWNER] },
    children: [
      {
        path: '',
        component: OwnerLayoutComponent,
        children: [
          {
            path: 'dashboard',
            component: OwnerDashboardComponent,
            data: { title: 'Mon Espace Copropriétaire' }
          },
          {
            path: 'my-units',
            component: OwnerUnitsComponent
          },
          {
            path: 'invoices',
            children: [
              { path: '', component: OwnerInvoicesComponent },
              { path: ':id', component: InvoiceDetailComponent },
              { path: ':id/pay', component: InvoicePaymentComponent }
            ]
          },
          {
            path: 'maintenance',
            children: [
              { path: '', component: OwnerMaintenanceRequestsComponent },
              { path: 'new', component: CreateMaintenanceRequestComponent },
              { path: ':id', component: MaintenanceRequestDetailComponent }
            ]
          },
          {
            path: 'documents',
            component: OwnerDocumentsComponent
          },
          {
            path: 'general-assembly',
            component: GeneralAssemblyComponent
          }
        ]
      }
    ]
  },
  
  // ============================================================
  // CONSEIL SYNDICAL - Interface de Contrôle
  // ============================================================
  {
    path: 'council',
    canActivate: [RoleGuard],
    data: { roles: [CopropertyRole.COUNCIL, CopropertyRole.ADMIN] },
    children: [
      {
        path: '',
        component: CouncilLayoutComponent,
        children: [
          {
            path: 'dashboard',
            component: CouncilDashboardComponent,
            data: { title: 'Conseil Syndical' }
          },
          {
            path: 'financial-control',
            component: FinancialControlComponent
          },
          {
            path: 'contracts',
            component: ContractsManagementComponent
          },
          {
            path: 'general-assembly',
            children: [
              { path: '', component: AGListComponent },
              { path: 'prepare/:id', component: AGPreparationComponent },
              { path: ':id/resolutions', component: ResolutionsComponent }
            ]
          },
          {
            path: 'reports',
            component: CouncilReportsComponent,
            data: { access: 'read-only' }
          }
        ]
      }
    ]
  },
  
  // ============================================================
  // COMPTABLE - Interface Financière
  // ============================================================
  {
    path: 'accountant',
    canActivate: [RoleGuard],
    data: { roles: [CopropertyRole.ACCOUNTANT, CopropertyRole.ADMIN] },
    children: [
      {
        path: '',
        component: AccountantLayoutComponent,
        children: [
          {
            path: 'dashboard',
            component: AccountantDashboardComponent,
            data: { title: 'Tableau de Bord Comptable' }
          },
          {
            path: 'accounting',
            children: [
              { path: 'entries', component: AccountingEntriesComponent },
              { path: 'journals', component: AccountingJournalsComponent },
              { path: 'reconciliation', component: BankReconciliationComponent }
            ]
          },
          {
            path: 'reports',
            children: [
              { path: 'balance-sheet', component: BalanceSheetComponent },
              { path: 'income-statement', component: IncomeStatementComponent },
              { path: 'annual-closure', component: AnnualClosureComponent }
            ]
          },
          {
            path: 'export',
            component: DataExportComponent
          }
        ]
      }
    ]
  },
  
  // ============================================================
  // ADMIN SYSTÈME - Interface d'Administration
  // ============================================================
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: [CopropertyRole.ADMIN] },
    children: [
      {
        path: '',
        component: AdminLayoutComponent,
        children: [
          {
            path: 'users',
            component: UserManagementComponent
          },
          {
            path: 'permissions',
            component: PermissionsManagementComponent
          },
          {
            path: 'monitoring',
            component: SystemMonitoringComponent
          },
          {
            path: 'logs',
            component: SystemLogsComponent
          }
        ]
      }
    ]
  }
];
```

---

### 🎯 Guards de Protection

```typescript
// guards/role.guard.ts

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private authRoleService: AuthRoleService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as CopropertyRole[];
    
    if (!requiredRoles) {
      return true;
    }
    
    const hasRole = requiredRoles.some(role => 
      this.authRoleService.hasRole(role)
    );
    
    if (!hasRole) {
      // Rediriger vers l'interface appropriée
      this.router.navigate([this.authRoleService.getDefaultRoute()]);
      return false;
    }
    
    return true;
  }
}

// guards/permissions.guard.ts

@Injectable({ providedIn: 'root' })
export class PermissionsGuard implements CanActivate {
  constructor(
    private authRoleService: AuthRoleService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as string;
    
    if (!requiredPermission) {
      return true;
    }
    
    if (!this.authRoleService.hasPermission(requiredPermission)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }
    
    return true;
  }
}
```

---

### 🎨 Layouts Différenciés par Rôle

#### 1. Layout Syndic (Interface Complète)

```typescript
// layouts/syndic-layout/syndic-layout.component.ts

@Component({
  selector: 'app-syndic-layout',
  template: `
    <div class="syndic-layout">
      <!-- Sidebar avec navigation complète -->
      <aside class="sidebar">
        <div class="logo">
          <img src="assets/logo.svg" alt="MYB">
          <span class="role-badge">Syndic</span>
        </div>
        
        <nav class="main-nav">
          <a routerLink="/coproperty/syndic/dashboard" routerLinkActive="active">
            <i class="bi bi-speedometer2"></i>
            <span>Tableau de bord</span>
          </a>
          
          <a routerLink="/coproperty/syndic/coproperties" routerLinkActive="active">
            <i class="bi bi-building"></i>
            <span>Copropriétés</span>
            <span class="badge">12</span>
          </a>
          
          <a routerLink="/coproperty/syndic/charges" routerLinkActive="active">
            <i class="bi bi-cash-stack"></i>
            <span>Charges</span>
          </a>
          
          <a routerLink="/coproperty/syndic/invoices" routerLinkActive="active">
            <i class="bi bi-receipt"></i>
            <span>Factures</span>
            <span class="badge alert" *ngIf="unpaidInvoices() > 0">
              {{ unpaidInvoices() }}
            </span>
          </a>
          
          <a routerLink="/coproperty/syndic/maintenance" routerLinkActive="active">
            <i class="bi bi-tools"></i>
            <span>Demandes Travaux</span>
            <span class="badge urgent" *ngIf="urgentRequests() > 0">
              {{ urgentRequests() }}
            </span>
          </a>
          
          <a routerLink="/coproperty/syndic/fund-calls" routerLinkActive="active">
            <i class="bi bi-calendar-check"></i>
            <span>Appels de Fonds</span>
          </a>
          
          <a routerLink="/coproperty/syndic/reports" routerLinkActive="active">
            <i class="bi bi-graph-up"></i>
            <span>Rapports</span>
          </a>
        </nav>
      </aside>
      
      <!-- Zone principale -->
      <div class="main-content">
        <header class="top-bar">
          <div class="breadcrumb">
            <app-breadcrumb></app-breadcrumb>
          </div>
          
          <div class="actions">
            <button class="btn-icon" (click)="toggleNotifications()">
              <i class="bi bi-bell"></i>
              <span class="notification-badge" *ngIf="notifications() > 0">
                {{ notifications() }}
              </span>
            </button>
            
            <div class="user-menu">
              <img [src]="currentUser().avatar" alt="Profile">
              <span>{{ currentUser().name }}</span>
            </div>
          </div>
        </header>
        
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .syndic-layout {
      display: flex;
      height: 100vh;
      background: #f5f7fa;
    }
    
    .sidebar {
      width: 280px;
      background: #1e293b;
      color: white;
      display: flex;
      flex-direction: column;
    }
    
    .main-nav a {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #94a3b8;
      transition: all 0.2s;
    }
    
    .main-nav a:hover {
      background: #334155;
      color: white;
    }
    
    .main-nav a.active {
      background: #3b82f6;
      color: white;
    }
    
    .badge.alert {
      background: #ef4444;
    }
    
    .badge.urgent {
      background: #f59e0b;
    }
  `]
})
export class SyndicLayoutComponent {
  currentUser = signal({ name: 'Marie Dubois', avatar: 'assets/avatars/marie.jpg' });
  notifications = signal(3);
  unpaidInvoices = signal(5);
  urgentRequests = signal(2);
}
```

#### 2. Layout Copropriétaire (Portail Simplifié)

```typescript
// layouts/owner-layout/owner-layout.component.ts

@Component({
  selector: 'app-owner-layout',
  template: `
    <div class="owner-layout">
      <!-- Navigation horizontale -->
      <header class="top-header">
        <div class="container">
          <div class="logo">
            <img src="assets/logo.svg" alt="MYB">
            <span>Espace Copropriétaire</span>
          </div>
          
          <nav class="main-nav">
            <a routerLink="/coproperty/owner/dashboard" routerLinkActive="active">
              <i class="bi bi-house"></i>
              Accueil
            </a>
            <a routerLink="/coproperty/owner/invoices" routerLinkActive="active">
              <i class="bi bi-receipt"></i>
              Mes Factures
              <span class="badge" *ngIf="unpaidInvoices() > 0">
                {{ unpaidInvoices() }}
              </span>
            </a>
            <a routerLink="/coproperty/owner/maintenance" routerLinkActive="active">
              <i class="bi bi-tools"></i>
              Demandes
            </a>
            <a routerLink="/coproperty/owner/documents" routerLinkActive="active">
              <i class="bi bi-file-earmark"></i>
              Documents
            </a>
          </nav>
          
          <div class="user-menu">
            <img [src]="currentUser().avatar" alt="Profile">
            <span>{{ currentUser().name }}</span>
          </div>
        </div>
      </header>
      
      <!-- Contenu principal -->
      <main class="main-content">
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </main>
      
      <!-- Footer simple -->
      <footer class="footer">
        <div class="container">
          <p>© 2026 MYB - Gestion de Copropriété</p>
          <div class="links">
            <a href="#">Support</a>
            <a href="#">CGU</a>
            <a href="#">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .owner-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }
    
    .top-header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .main-nav {
      display: flex;
      gap: 32px;
    }
    
    .main-nav a {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 20px 0;
      color: #64748b;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }
    
    .main-nav a.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    
    .main-content {
      flex: 1;
      padding: 40px 0;
    }
    
    .footer {
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 30px 0;
      color: #64748b;
    }
  `]
})
export class OwnerLayoutComponent {
  currentUser = signal({ name: 'Jean Martin', avatar: 'assets/avatars/jean.jpg' });
  unpaidInvoices = signal(1);
}
```

#### 3. Layout Conseil Syndical (Interface de Supervision)

```typescript
// layouts/council-layout/council-layout.component.ts

@Component({
  selector: 'app-council-layout',
  template: `
    <div class="council-layout">
      <aside class="sidebar">
        <div class="logo">
          <img src="assets/logo.svg" alt="MYB">
          <span class="role-badge council">Conseil Syndical</span>
        </div>
        
        <nav class="main-nav">
          <a routerLink="/coproperty/council/dashboard" routerLinkActive="active">
            <i class="bi bi-speedometer2"></i>
            Tableau de bord
          </a>
          
          <a routerLink="/coproperty/council/financial-control" routerLinkActive="active">
            <i class="bi bi-calculator"></i>
            Contrôle Financier
          </a>
          
          <a routerLink="/coproperty/council/contracts" routerLinkActive="active">
            <i class="bi bi-file-text"></i>
            Contrats
          </a>
          
          <a routerLink="/coproperty/council/general-assembly" routerLinkActive="active">
            <i class="bi bi-people"></i>
            Assemblées Générales
          </a>
          
          <a routerLink="/coproperty/council/reports" routerLinkActive="active">
            <i class="bi bi-graph-up"></i>
            Rapports
            <span class="badge read-only">Lecture</span>
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <div class="info-box">
            <i class="bi bi-info-circle"></i>
            <p>Accès en lecture seule pour les rapports financiers</p>
          </div>
        </div>
      </aside>
      
      <div class="main-content">
        <header class="top-bar">
          <h1>{{ pageTitle() }}</h1>
          <div class="user-menu">
            <span>{{ currentUser().name }}</span>
          </div>
        </header>
        
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .role-badge.council {
      background: #8b5cf6;
    }
    
    .badge.read-only {
      background: #6b7280;
      font-size: 10px;
    }
    
    .info-box {
      padding: 16px;
      background: #1e293b;
      border-radius: 8px;
      margin: 16px;
    }
  `]
})
export class CouncilLayoutComponent {
  currentUser = signal({ name: 'Pierre Rousseau' });
  pageTitle = signal('Conseil Syndical');
}
```

---

### 📊 Matrice de Permissions par Rôle

```typescript
// models/permissions.model.ts

export const ROLE_PERMISSIONS = {
  [CopropertyRole.SYNDIC]: [
    // CRUD Complet
    'coproperty:create',
    'coproperty:read',
    'coproperty:update',
    'coproperty:delete',
    
    // Gestion charges
    'charges:create',
    'charges:update',
    'charges:delete',
    'charges:distribute',
    
    // Gestion factures
    'invoices:create',
    'invoices:read',
    'invoices:update',
    'invoices:send',
    
    // Paiements
    'payments:view',
    'payments:record',
    
    // Travaux
    'maintenance:create',
    'maintenance:assign',
    'maintenance:update',
    'maintenance:close',
    
    // Rapports
    'reports:generate',
    'reports:export',
    
    // Appels de fonds
    'fundcalls:create',
    'fundcalls:send',
  ],
  
  [CopropertyRole.OWNER]: [
    // Lecture seule données personnelles
    'owner:view-own-units',
    'owner:view-own-invoices',
    'owner:view-own-payments',
    
    // Actions limitées
    'owner:pay-invoices',
    'owner:download-documents',
    'owner:create-maintenance-request',
    'owner:view-general-assembly',
  ],
  
  [CopropertyRole.COUNCIL]: [
    // Lecture étendue
    'coproperty:read',
    'charges:read',
    'invoices:read',
    'payments:view',
    'reports:view',
    'contracts:view',
    
    // Actions spécifiques
    'financial:control',
    'assembly:prepare',
    'assembly:vote',
    'contracts:review',
  ],
  
  [CopropertyRole.ACCOUNTANT]: [
    // Accès financier complet
    'accounting:entries',
    'accounting:journals',
    'accounting:reconciliation',
    'accounting:export',
    
    // Rapports comptables
    'reports:balance-sheet',
    'reports:income-statement',
    'reports:annual-closure',
    
    // Lecture données
    'invoices:read',
    'payments:view',
    'charges:read',
  ],
  
  [CopropertyRole.ADMIN]: [
    '*' // Accès complet
  ]
};
```

---

### 🎨 Design System par Rôle

#### Couleurs Thématiques

```scss
// styles/themes/roles.scss

// Syndic - Bleu professionnel
.syndic-theme {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --sidebar-bg: #1e293b;
  --accent: #60a5fa;
}

// Copropriétaire - Vert accueillant
.owner-theme {
  --primary-color: #10b981;
  --primary-hover: #059669;
  --header-bg: white;
  --accent: #34d399;
}

// Conseil Syndical - Violet institutionnel
.council-theme {
  --primary-color: #8b5cf6;
  --primary-hover: #7c3aed;
  --sidebar-bg: #1e293b;
  --accent: #a78bfa;
}

// Comptable - Orange analytique
.accountant-theme {
  --primary-color: #f59e0b;
  --primary-hover: #d97706;
  --sidebar-bg: #1e293b;
  --accent: #fbbf24;
}

// Admin - Rouge administratif
.admin-theme {
  --primary-color: #ef4444;
  --primary-hover: #dc2626;
  --sidebar-bg: #1e293b;
  --accent: #f87171;
}
```

---

### 📱 Navigation Adaptative selon Rôle

```typescript
// components/app-navigation/app-navigation.component.ts

@Component({
  selector: 'app-navigation',
  template: `
    <!-- Navigation dynamique selon rôle -->
    <ng-container [ngSwitch]="currentRole()">
      <!-- Syndic: Sidebar complète -->
      <app-syndic-sidebar *ngSwitchCase="'coproperty-syndic'">
      </app-syndic-sidebar>
      
      <!-- Owner: Top nav simple -->
      <app-owner-navbar *ngSwitchCase="'coproperty-owner'">
      </app-owner-navbar>
      
      <!-- Council: Sidebar avec badges read-only -->
      <app-council-sidebar *ngSwitchCase="'coproperty-council'">
      </app-council-sidebar>
      
      <!-- Accountant: Sidebar financière -->
      <app-accountant-sidebar *ngSwitchCase="'coproperty-accountant'">
      </app-accountant-sidebar>
      
      <!-- Admin: Sidebar système -->
      <app-admin-sidebar *ngSwitchCase="'system-admin'">
      </app-admin-sidebar>
    </ng-container>
  `
})
export class AppNavigationComponent {
  currentRole = computed(() => 
    this.authRoleService.getPrimaryRole()
  );
  
  constructor(private authRoleService: AuthRoleService) {}
}
```

---

### 🔄 Gestion du State par Rôle

```typescript
// services/role-state.service.ts

@Injectable({ providedIn: 'root' })
export class RoleStateService {
  // État syndic
  private syndicState = {
    managedCoproperties: signal<Coproperty[]>([]),
    totalUnits: signal<number>(0),
    pendingInvoices: signal<number>(0),
    urgentRequests: signal<number>(0)
  };
  
  // État copropriétaire
  private ownerState = {
    myUnits: signal<Unit[]>([]),
    myInvoices: signal<CopropertyInvoice[]>([]),
    unpaidBalance: signal<number>(0),
    nextAG: signal<GeneralAssembly | null>(null)
  };
  
  // État conseil syndical
  private councilState = {
    copropertyData: signal<Coproperty | null>(null),
    financialAlerts: signal<FinancialAlert[]>([]),
    upcomingAG: signal<GeneralAssembly | null>(null),
    contracts: signal<Contract[]>([])
  };
  
  // État comptable
  private accountantState = {
    pendingReconciliations: signal<number>(0),
    monthlyClosures: signal<MonthlyBalance[]>([]),
    exportQueue: signal<ExportJob[]>([])
  };
  
  // Récupération de l'état selon rôle
  getStateForRole(role: CopropertyRole) {
    switch (role) {
      case CopropertyRole.SYNDIC:
        return this.syndicState;
      case CopropertyRole.OWNER:
        return this.ownerState;
      case CopropertyRole.COUNCIL:
        return this.councilState;
      case CopropertyRole.ACCOUNTANT:
        return this.accountantState;
      default:
        return null;
    }
  }
}
```

---

### 🎯 Plan d'Implémentation Frontend

#### Phase 1: Infrastructure (Semaine 1)
- ✅ Services d'authentification et rôles
- ✅ Guards et middlewares
- ✅ Routing de base par rôle
- ✅ Layouts principaux

#### Phase 2: Interface Syndic (Semaine 2-3)
- ✅ Dashboard syndic complet
- ✅ Gestion copropriétés (CRUD)
- ✅ Gestion charges et factures
- ✅ Appels de fonds
- ✅ Rapports financiers

#### Phase 3: Portail Copropriétaire (Semaine 4)
- ✅ Dashboard simplifié
- ✅ Consultation factures
- ✅ Paiement en ligne (Stripe)
- ✅ Demandes de travaux
- ✅ Documents AG

#### Phase 4: Interface Conseil Syndical (Semaine 5)
- ✅ Dashboard de contrôle
- ✅ Vue financière (read-only)
- ✅ Gestion contrats
- ✅ Préparation AG

#### Phase 5: Interface Comptable (Semaine 6)
- ✅ Saisie comptable
- ✅ Rapprochement bancaire
- ✅ Exports FEC
- ✅ Clôture annuelle

#### Phase 6: Tests et Optimisation (Semaine 7-8)
- ✅ Tests e2e par rôle
- ✅ Tests de permissions
- ✅ Optimisation performance
- ✅ Documentation utilisateur

---

### 📋 Checklist Avant Implémentation

**Architecture:**
- [ ] Valider structure de routing
- [ ] Confirmer système de permissions
- [ ] Valider design des layouts
- [ ] Approuver navigation par rôle

**Design:**
- [ ] Valider maquettes par rôle
- [ ] Confirmer couleurs thématiques
- [ ] Approuver wireframes
- [ ] Valider responsive design

**Fonctionnel:**
- [ ] Confirmer features par rôle
- [ ] Valider permissions granulaires
- [ ] Approuver workflows utilisateurs
- [ ] Valider intégrations API

**Technique:**
- [ ] Confirmer stack technique
- [ ] Valider stratégie de state management
- [ ] Approuver patterns de composants
- [ ] Valider stratégie de tests

---

**⚠️ ATTENTE CONFIRMATION AVANT IMPLÉMENTATION**

---

## 🏢 SCÉNARIO 1: Syndic / Gestionnaire

### Profil Utilisateur
**Nom:** Marie Dubois  
**Rôle:** Syndic professionnel  
**Entreprise:** Gestion Immobilière Dubois & Associés  
**Gère:** 12 copropriétés (150 lots au total)

---

### 📋 Scénario 1.1 - Prise en Charge Nouvelle Copropriété

**Contexte:** Marie vient de signer un contrat pour gérer une nouvelle copropriété.

#### Étapes Détaillées

**1. Connexion à la Plateforme**
```
URL: https://myb.app/login
Utilisateur: marie.dubois@gestion-dubois.fr
Rôle: coproperty-syndic
```

**2. Création de la Copropriété**

```graphql
mutation CreateCoproperty {
  createCoproperty(input: {
    name: "Résidence Les Jardins du Parc"
    address: "45 Avenue Victor Hugo"
    city: "Paris"
    postalCode: "75016"
    country: "France"
    description: "Résidence de standing construite en 1990, composée de 3 bâtiments"
    totalUnits: 24
    totalShares: 2400
    commonAreas: "Hall d'entrée, Jardin (500m²), Parking souterrain (30 places), Local vélos"
    managerId: "uuid-marie-dubois"
    managerName: "Marie DUBOIS"
  }) {
    id
    name
    totalUnits
  }
}
```

**Résultat attendu:**
- ✅ Copropriété créée avec ID unique
- ✅ Visible dans le dashboard
- ✅ Prête pour l'ajout des lots

**3. Création des Lots**

Marie crée les 24 lots de la résidence:

```graphql
# Lot 1 - Appartement 1er étage Bâtiment A
mutation CreateUnit1 {
  createUnit(unit: {
    copropertyId: "uuid-jardins-du-parc"
    unitNumber: "A101"
    floor: 1
    area: 65.5
    shares: 100
    unitType: "T3"
    description: "2 chambres, balcon 8m²"
    isOccupied: true
  }) {
    id
    unitNumber
    shares
  }
}

# Lot 2 - Appartement 1er étage Bâtiment A
mutation CreateUnit2 {
  createUnit(unit: {
    copropertyId: "uuid-jardins-du-parc"
    unitNumber: "A102"
    floor: 1
    area: 45.0
    shares: 70
    unitType: "T2"
    description: "1 chambre"
    isOccupied: false
  }) {
    id
  }
}

# ... (répéter pour les 24 lots)
```

**4. Création des Copropriétaires**

```graphql
# Propriétaire du lot A101
mutation CreateOwner {
  createOwner(owner: {
    userId: "uuid-jean-martin"
    unitId: "uuid-lot-a101"
    ownershipPercentage: 100
    startDate: "2025-01-15"
    isMainOwner: true
  }) {
    id
    userId
    ownershipPercentage
  }
}
```

**5. Configuration des Charges Annuelles**

Marie configure toutes les charges de la copropriété:

```graphql
# Charge 1: Entretien & Nettoyage
mutation CreateCleaningCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Entretien des Parties Communes"
    description: "Nettoyage hebdomadaire (escaliers, halls, parking) + produits d'entretien"
    chargeType: CLEANING
    frequency: MONTHLY
    totalAmount: 1800.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    isActive: true
  }) {
    id
    name
    totalAmount
  }
}

# Charge 2: Gardiennage/Sécurité
mutation CreateSecurityCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Gardiennage et Surveillance"
    description: "Gardien résident + système vidéosurveillance"
    chargeType: SECURITY
    frequency: MONTHLY
    totalAmount: 2500.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    isActive: true
  }) {
    id
  }
}

# Charge 3: Électricité Communs
mutation CreateElectricityCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Électricité Parties Communes"
    description: "Éclairage halls, parkings, ascenseurs"
    chargeType: ELECTRICITY
    frequency: MONTHLY
    totalAmount: 800.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    isActive: true
  }) {
    id
  }
}

# Charge 4: Eau Froide Communs
mutation CreateWaterCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Eau Froide Parties Communes"
    description: "Arrosage jardins + nettoyage"
    chargeType: WATER
    frequency: MONTHLY
    totalAmount: 300.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    isActive: true
  }) {
    id
  }
}

# Charge 5: Assurance Immeuble
mutation CreateInsuranceCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Assurance Multirisque Immeuble"
    description: "Prime annuelle assurance copropriété"
    chargeType: INSURANCE
    frequency: ANNUAL
    totalAmount: 8400.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    isActive: true
  }) {
    id
  }
}

# Charge 6: Maintenance Ascenseurs
mutation CreateMaintenanceCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Maintenance Ascenseurs"
    description: "Contrat entretien + dépannage 3 ascenseurs"
    chargeType: MAINTENANCE
    frequency: QUARTERLY
    totalAmount: 1500.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    isActive: true
  }) {
    id
  }
}
```

**6. Prévisualisation de la Répartition des Charges**

```graphql
query PreviewDistribution {
  previewChargeDistribution(
    chargeId: "uuid-charge-nettoyage"
  ) {
    unitNumber
    ownerName
    shares
    amount
  }
}
```

**Résultat attendu:**
```json
[
  {
    "unitNumber": "A101",
    "ownerName": "Jean MARTIN",
    "shares": 100,
    "amount": 75.00
  },
  {
    "unitNumber": "A102",
    "ownerName": "Non occupé",
    "shares": 70,
    "amount": 52.50
  }
  // ... pour les 24 lots
]
```

**7. Validation et Envoi des Appels de Fonds**

```graphql
mutation CreateQuarterlyFundCall {
  createFundCall(input: {
    copropertyId: "uuid-jardins-du-parc"
    quarter: 1
    year: 2026
    dueDate: "2026-03-31"
    chargeIds: [
      "uuid-charge-nettoyage",
      "uuid-charge-securite",
      "uuid-charge-electricite",
      "uuid-charge-eau",
      "uuid-charge-maintenance"
    ]
  }) {
    id
    totalAmount
    invoicesGenerated
  }
}
```

**Résultat attendu:**
- ✅ 24 factures générées (une par lot)
- ✅ Emails envoyés aux copropriétaires
- ✅ PDF des factures disponibles
- ✅ Montant total validé

**Temps estimé pour ce scénario:** 2-3 heures  
**Fréquence:** Une fois lors de la prise en charge

---

### 📊 Scénario 1.2 - Gestion Quotidienne et Suivi

**Contexte:** Marie consulte son dashboard chaque matin pour suivre ses copropriétés.

#### Étapes Détaillées

**1. Consultation du Dashboard Global**

```typescript
// Accès au tableau de bord
navigate('/coproperty/dashboard')
```

**Affichage:**
- 📊 **Statistiques globales** (toutes copropriétés)
  - Total copropriétés gérées: 12
  - Total lots: 150
  - Total copropriétaires: 142
  - Taux d'occupation: 94%

- 💰 **Finances**
  - Montant total charges mensuelles: 45,600 €
  - Impayés du mois: 3,200 € (7%)
  - Trésorerie globale: 125,000 €
  - Appels de fonds en cours: 18

- ⚠️ **Alertes prioritaires**
  - 3 demandes de travaux urgentes
  - 5 factures en retard de paiement
  - 2 AG à planifier ce trimestre

**2. Consultation Détaillée d'une Copropriété**

```graphql
query GetCopropertyDashboard {
  dashboardStats(copropertyId: "uuid-jardins-du-parc") {
    totalUnits
    occupiedUnits
    totalOwners
    monthlyCharges
    unpaidAmount
    treasuryBalance
    pendingMaintenanceRequests
    upcomingGeneralAssembly
  }
}
```

**3. Vérification des Impayés**

```graphql
query GetUnpaidInvoices {
  unpaidInvoices(copropertyId: "uuid-jardins-du-parc") {
    invoiceNumber
    ownerName
    unitNumber
    amount
    dueDate
    daysOverdue
    status
  }
}
```

**Actions possibles:**
- 📧 Envoi de relance automatique
- 📞 Appel téléphonique (si > 30 jours)
- ⚖️ Mise en demeure (si > 90 jours)

**4. Traitement des Demandes de Travaux**

```graphql
query GetMaintenanceRequests {
  maintenanceRequests(copropertyId: "uuid-jardins-du-parc") {
    id
    title
    description
    category
    priority
    status
    unitNumber
    ownerName
    createdAt
  }
}
```

**Exemple de demande:**
```json
{
  "id": "uuid-request-1",
  "title": "Fuite d'eau lot A305",
  "description": "Infiltration d'eau au plafond de la salle de bain",
  "category": "PLUMBING",
  "priority": "EMERGENCY",
  "status": "PENDING",
  "unitNumber": "A305",
  "ownerName": "Sophie BERNARD",
  "createdAt": "2026-01-29T08:30:00Z"
}
```

**Actions de Marie:**
```graphql
# 1. Assigner à un technicien
mutation AssignMaintenance {
  updateMaintenanceRequest(
    id: "uuid-request-1"
    input: {
      status: ASSIGNED
      assignedTo: "uuid-plombier-dupont"
      scheduledDate: "2026-01-29"
      estimatedCost: 350.00
    }
  ) {
    id
    status
    assignedTo
  }
}

# 2. Notifier le copropriétaire
mutation SendNotification {
  sendMaintenanceNotification(
    requestId: "uuid-request-1"
    message: "Un plombier interviendra aujourd'hui entre 14h et 17h"
  ) {
    sent
  }
}
```

**Temps estimé pour ce scénario:** 30-45 minutes/jour  
**Fréquence:** Quotidienne

---

### 💸 Scénario 1.3 - Gestion Financière et Reporting

**Contexte:** Fin de trimestre - Marie prépare les rapports financiers pour les AG.

#### Étapes Détaillées

**1. Génération du Rapport Financier Annuel**

```graphql
query GetFinancialReport {
  financialReport(
    copropertyId: "uuid-jardins-du-parc"
    year: 2026
  ) {
    totalRevenue
    totalExpenses
    netBalance
    monthlyBalances {
      month
      revenue
      expenses
      balance
    }
    chargesSummary {
      chargeType
      totalAmount
      percentage
    }
    paymentsSummary {
      totalPaid
      totalUnpaid
      paymentRate
    }
  }
}
```

**2. Évolution de la Trésorerie**

```graphql
query GetTreasuryEvolution {
  treasuryEvolution(
    copropertyId: "uuid-jardins-du-parc"
    months: 12
  ) {
    month
    balance
    income
    expenses
  }
}
```

**3. Export des Données pour l'Expert Comptable**

```graphql
mutation ExportFinancialData {
  exportFinancialData(
    copropertyId: "uuid-jardins-du-parc"
    startDate: "2026-01-01"
    endDate: "2026-12-31"
    format: CSV
  ) {
    downloadUrl
    expiresAt
  }
}
```

**4. Préparation de l'Assemblée Générale**

```graphql
mutation CreateGeneralAssembly {
  createGeneralAssembly(input: {
    copropertyId: "uuid-jardins-du-parc"
    date: "2026-06-15"
    location: "Salle des Fêtes - Mairie du 16ème"
    agenda: [
      "Approbation des comptes 2025",
      "Vote du budget prévisionnel 2026",
      "Travaux de ravalement (vote)",
      "Renouvellement du contrat de gardiennage",
      "Questions diverses"
    ]
    documents: [
      "Bilan financier 2025",
      "Budget prévisionnel 2026",
      "Devis ravalement"
    ]
  }) {
    id
    invitationsSent
  }
}
```

**Temps estimé pour ce scénario:** 4-6 heures/trimestre  
**Fréquence:** Trimestrielle

---

### 🔧 Scénario 1.4 - Gestion d'un Projet de Travaux

**Contexte:** La copropriété doit réaliser des travaux de ravalement de façade.

#### Étapes Détaillées

**1. Création de la Charge Exceptionnelle**

```graphql
mutation CreateExceptionalCharge {
  createCharge(input: {
    copropertyId: "uuid-jardins-du-parc"
    name: "Travaux de Ravalement de Façade"
    description: "Ravalement complet des 3 bâtiments + réfection balcons"
    chargeType: MAINTENANCE
    frequency: EXCEPTIONAL
    totalAmount: 145000.00
    distributionMethod: BY_SHARES
    startDate: "2026-09-01"
    isActive: true
  }) {
    id
    totalAmount
  }
}
```

**2. Calcul et Envoi des Appels de Fonds Échelonnés**

```graphql
# Appel de fonds 1/3 (40%)
mutation CreateWorksFundCall1 {
  createFundCall(input: {
    copropertyId: "uuid-jardins-du-parc"
    description: "Travaux ravalement - 1er appel (40%)"
    dueDate: "2026-09-30"
    amount: 58000.00
    chargeIds: ["uuid-charge-ravalement"]
    installmentNumber: 1
    totalInstallments: 3
  }) {
    id
    invoicesGenerated
  }
}

# Appels 2/3 et 3/3 suivront
```

**3. Suivi de l'Avancement**

```graphql
query GetWorksProgress {
  charge(id: "uuid-charge-ravalement") {
    totalAmount
    distributions {
      unitNumber
      amount
      status
    }
    payments {
      totalPaid
      totalPending
      paymentRate
    }
  }
}
```

**4. Gestion des Copropriétaires en Difficulté**

```graphql
mutation CreatePaymentPlan {
  createPaymentPlan(input: {
    ownerId: "uuid-owner-durand"
    invoiceId: "uuid-invoice-ravalement"
    installments: [
      { dueDate: "2026-10-15", amount: 800.00 },
      { dueDate: "2026-11-15", amount: 800.00 },
      { dueDate: "2026-12-15", amount: 800.00 }
    ]
  }) {
    id
    status
  }
}
```

**Temps estimé pour ce scénario:** 10-15 heures (sur 6 mois)  
**Fréquence:** Occasionnelle (grands travaux)

---

## 🏠 SCÉNARIO 2: Copropriétaire

### Profil Utilisateur
**Nom:** Jean Martin  
**Rôle:** Copropriétaire  
**Lot:** A101 - Résidence Les Jardins du Parc  
**Situation:** Propriétaire occupant, membre actif de la copropriété

---

### 📱 Scénario 2.1 - Consultation du Portail Copropriétaire

**Contexte:** Jean se connecte au portail pour consulter ses informations.

#### Étapes Détaillées

**1. Connexion au Portail**

```
URL: https://myb.app/coproperty/owner
Utilisateur: jean.martin@email.fr
Rôle: coproperty-owner
```

**2. Vue du Dashboard Personnel**

```graphql
query GetOwnerDashboard {
  myUnits(userId: "uuid-jean-martin") {
    id
    unitNumber
    coproperty {
      name
      address
    }
    area
    shares
    ownershipPercentage
  }
  
  myInvoices(ownerId: "uuid-owner-jean") {
    invoiceNumber
    chargeDescription
    amount
    dueDate
    status
    isPaid
  }
  
  unpaidBalance: myUnpaidAmount(ownerId: "uuid-owner-jean")
  
  nextGeneralAssembly(copropertyId: "uuid-jardins-du-parc") {
    date
    location
    agenda
  }
}
```

**Affichage du Dashboard:**

```
╔══════════════════════════════════════════════════════╗
║  MON ESPACE COPROPRIÉTAIRE                          ║
╚══════════════════════════════════════════════════════╝

📍 Mon Lot
   • Résidence: Les Jardins du Parc
   • Numéro: A101
   • Surface: 65,5 m²
   • Tantièmes: 100/2400 (4,17%)

💶 Situation Financière
   • Charges mensuelles: 287,50 €
   • Solde impayé: 0,00 € ✅
   • Prochaine échéance: 15/02/2026

📊 Charges Annuelles Estimées: 3,450 €
   - Entretien: 900 €
   - Sécurité: 1,250 €
   - Électricité: 400 €
   - Eau: 150 €
   - Assurance: 350 €
   - Maintenance: 400 €

📅 Prochaine AG
   Date: 15 Juin 2026 à 18h30
   Lieu: Salle des Fêtes - Mairie du 16ème
   📎 Documents disponibles (3)

⚠️ Notifications (1)
   • Nouvelle facture disponible (Janvier 2026)
```

**3. Consultation des Factures**

```graphql
query GetMyInvoices {
  myInvoices(ownerId: "uuid-owner-jean") {
    invoiceNumber
    invoiceDate
    dueDate
    charges {
      name
      amount
    }
    taxAmount
    totalAmount
    status
    pdfUrl
  }
}
```

**Temps estimé pour ce scénario:** 5-10 minutes  
**Fréquence:** Hebdomadaire

---

### 💳 Scénario 2.2 - Paiement d'une Facture en Ligne

**Contexte:** Jean reçoit une notification pour sa facture trimestrielle.

#### Étapes Détaillées

**1. Consultation de la Facture**

```graphql
query GetInvoiceDetails {
  invoiceDetails(id: "uuid-invoice-q1-2026") {
    invoiceNumber
    invoiceDate
    dueDate
    charges {
      name
      description
      amount
    }
    subtotal
    taxAmount
    totalAmount
    status
  }
}
```

**Détails affichés:**
```
╔══════════════════════════════════════════════════════╗
║  FACTURE N° INV-2026-Q1-A101                        ║
╚══════════════════════════════════════════════════════╝

Date: 01/01/2026
Échéance: 31/01/2026
Lot: A101

─────────────────────────────────────────────────────
CHARGES 1ER TRIMESTRE 2026

Entretien parties communes         225,00 €
Gardiennage et surveillance         375,00 €
Électricité parties communes        120,00 €
Eau froide parties communes          45,00 €
Maintenance ascenseurs               75,00 €
─────────────────────────────────────────────────────
SOUS-TOTAL                          840,00 €
TVA (20%)                           168,00 €
─────────────────────────────────────────────────────
TOTAL À PAYER                     1,008,00 €
─────────────────────────────────────────────────────

📥 Télécharger PDF
💳 PAYER EN LIGNE
```

**2. Processus de Paiement**

```graphql
mutation InitiatePayment {
  createPaymentIntent(
    invoiceId: "uuid-invoice-q1-2026"
    amount: 1008.00
    paymentMethod: CREDIT_CARD
  ) {
    clientSecret
    paymentIntentId
  }
}
```

**Frontend - Interface Stripe:**
```typescript
// Utilisation de Stripe Elements
const stripe = await loadStripe('pk_live_...');

const elements = stripe.elements({
  clientSecret: clientSecret
});

const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');
```

**3. Confirmation du Paiement**

```graphql
mutation ConfirmPayment {
  recordPayment(input: {
    invoiceId: "uuid-invoice-q1-2026"
    amount: 1008.00
    paymentMethod: "Carte bancaire Visa ****1234"
    transactionId: "pi_stripe_abc123"
    paymentDate: "2026-01-29"
  }) {
    id
    status
    receiptUrl
  }
}
```

**Email de confirmation automatique:**
```
Objet: ✅ Paiement confirmé - Facture INV-2026-Q1-A101

Bonjour M. MARTIN,

Votre paiement a bien été enregistré.

Montant: 1,008,00 €
Date: 29/01/2026
Moyen: Carte bancaire ****1234

📥 Télécharger votre reçu

Merci de votre confiance.

Cordialement,
Gestion Immobilière Dubois & Associés
```

**Temps estimé pour ce scénario:** 3-5 minutes  
**Fréquence:** Trimestrielle

---

### 🔧 Scénario 2.3 - Signalement d'un Problème

**Contexte:** Jean constate une fuite d'eau dans son appartement.

#### Étapes Détaillées

**1. Création d'une Demande de Travaux**

```graphql
mutation CreateMaintenanceRequest {
  createMaintenanceRequest(input: {
    copropertyId: "uuid-jardins-du-parc"
    unitId: "uuid-lot-a101"
    userId: "uuid-jean-martin"
    title: "Fuite d'eau salle de bain"
    description: "Infiltration d'eau au niveau du plafond de la salle de bain, côté fenêtre. L'eau semble provenir de l'étage supérieur (A201). Dégât visible sur environ 30cm de diamètre."
    category: PLUMBING
    priority: EMERGENCY
    photos: [
      "https://storage.myb.app/photos/fuite-1.jpg",
      "https://storage.myb.app/photos/fuite-2.jpg"
    ]
  }) {
    id
    requestNumber
    status
    createdAt
  }
}
```

**2. Suivi de la Demande**

```graphql
query TrackMaintenanceRequest {
  maintenanceRequest(id: "uuid-request-fuite") {
    requestNumber
    status
    assignedTo {
      name
      phone
      email
    }
    scheduledDate
    estimatedCost
    actualCost
    updates {
      date
      message
      author
    }
  }
}
```

**Affichage du suivi:**
```
╔══════════════════════════════════════════════════════╗
║  DEMANDE DE TRAVAUX #REQ-2026-0042                  ║
╚══════════════════════════════════════════════════════╝

📋 Titre: Fuite d'eau salle de bain
🔧 Catégorie: Plomberie
⚠️  Priorité: URGENTE
📊 Statut: ASSIGNÉ

👨‍🔧 Technicien assigné
   Dupont Plomberie
   ☎️  01 45 67 89 00
   📧 contact@dupont-plomberie.fr

📅 Intervention prévue
   29/01/2026 entre 14h et 17h

💶 Coût estimé: 350,00 €

──────────────────────────────────────────────────────
HISTORIQUE

29/01 09:15 - Demande créée
29/01 09:30 - Prise en charge par le syndic
29/01 10:00 - Technicien assigné
29/01 10:15 - Intervention programmée pour aujourd'hui
──────────────────────────────────────────────────────
```

**3. Notification de Résolution**

Jean reçoit un SMS et un email:
```
🔧 Intervention terminée

Votre demande #REQ-2026-0042 a été traitée.

Travaux effectués:
- Remplacement joint WC appartement A201
- Réparation infiltration
- Vérification étanchéité

Coût: 280,00 € (imputé sur charges copropriété)

Veuillez valider l'intervention dans votre espace.
```

**4. Validation et Notation**

```graphql
mutation ValidateIntervention {
  validateMaintenanceRequest(
    id: "uuid-request-fuite"
    input: {
      status: COMPLETED
      rating: 5
      comment: "Intervention rapide et efficace. Technicien très professionnel."
      completedDate: "2026-01-29"
    }
  ) {
    id
    status
  }
}
```

**Temps estimé pour ce scénario:** 10-15 minutes (création + suivi)  
**Fréquence:** Occasionnelle

---

## 👔 SCÉNARIO 3: Conseil Syndical

### Profil Utilisateur
**Nom:** Pierre Rousseau  
**Rôle:** Président du Conseil Syndical  
**Lot:** B203  
**Mandat:** 3 ans

---

### 📊 Scénario 3.1 - Préparation de l'Assemblée Générale

**Contexte:** Pierre prépare l'AG annuelle avec accès aux données financières.

#### Étapes Détaillées

**1. Consultation des Rapports Financiers**

```graphql
query GetAGFinancialData {
  financialReport(
    copropertyId: "uuid-jardins-du-parc"
    year: 2025
  ) {
    totalRevenue
    totalExpenses
    netBalance
    
    chargesSummary {
      chargeType
      totalAmount
      percentage
      evolution
    }
    
    paymentsSummary {
      totalPaid
      totalUnpaid
      paymentRate
      latePayments
    }
    
    comparativePreviousYear {
      revenue
      expenses
      variation
    }
  }
}
```

**2. Analyse des Comptes**

```graphql
query GetDetailedAccounts {
  accountingEntries(
    copropertyId: "uuid-jardins-du-parc"
    startDate: "2025-01-01"
    endDate: "2025-12-31"
  ) {
    date
    description
    debit
    credit
    balance
    category
  }
}
```

**3. Vérification des Contrats Fournisseurs**

```graphql
query GetSupplierContracts {
  contracts(copropertyId: "uuid-jardins-du-parc") {
    supplier
    service
    startDate
    endDate
    annualCost
    renewalDate
    status
  }
}
```

**Exemple de vue:**
```
╔══════════════════════════════════════════════════════╗
║  CONTRATS FOURNISSEURS 2025                         ║
╚══════════════════════════════════════════════════════╝

🧹 Nettoyage - CLEAN PRO
   Début: 01/01/2023
   Fin: 31/12/2026
   Coût annuel: 21,600 €
   Renouvellement: Non requis

👮 Gardiennage - SECU PLUS
   Début: 01/09/2024
   Fin: 31/08/2027
   Coût annuel: 30,000 €
   ⚠️  À renégocier (prix +8%)

🔧 Maintenance Ascenseurs - OTIS
   Début: 01/01/2025
   Fin: 31/12/2025
   Coût annuel: 6,000 €
   ⚠️  Renouvellement requis (Juin 2026)
```

**4. Rédaction des Résolutions**

Pierre utilise l'interface pour préparer les votes:

```graphql
mutation CreateAGResolutions {
  createResolutions(
    assemblyId: "uuid-ag-2026"
    resolutions: [
      {
        number: 1
        title: "Approbation des comptes de l'exercice 2025"
        description: "Approbation du bilan financier..."
        type: ORDINARY
        requiredMajority: SIMPLE
      },
      {
        number: 2
        title: "Adoption du budget prévisionnel 2026"
        description: "Budget total: 52,000€..."
        type: ORDINARY
        requiredMajority: SIMPLE
        attachments: ["budget-2026.pdf"]
      },
      {
        number: 3
        title: "Vote des travaux de ravalement"
        description: "Montant: 145,000€..."
        type: MAJOR_WORKS
        requiredMajority: DOUBLE
        attachments: ["devis-ravalement.pdf"]
      }
    ]
  ) {
    resolutionsCreated
  }
}
```

**Temps estimé pour ce scénario:** 6-8 heures  
**Fréquence:** Annuelle

---

### 🔍 Scénario 3.2 - Contrôle de Gestion

**Contexte:** Pierre effectue son contrôle mensuel des comptes.

#### Étapes Détaillées

**1. Vérification des Encaissements**

```graphql
query GetMonthlyPayments {
  payments(
    copropertyId: "uuid-jardins-du-parc"
    startDate: "2026-01-01"
    endDate: "2026-01-31"
  ) {
    date
    ownerName
    unitNumber
    amount
    paymentMethod
    invoiceNumber
  }
}
```

**2. Contrôle des Dépenses**

```graphql
query GetMonthlyExpenses {
  expenses(
    copropertyId: "uuid-jardins-du-parc"
    startDate: "2026-01-01"
    endDate: "2026-01-31"
  ) {
    date
    supplier
    description
    amount
    category
    invoiceNumber
    paid
  }
}
```

**3. Alerte sur Anomalies**

```graphql
query GetFinancialAlerts {
  financialAlerts(copropertyId: "uuid-jardins-du-parc") {
    type
    severity
    description
    amount
    date
  }
}
```

**Exemples d'alertes:**
```
⚠️  ALERTES FINANCIÈRES

🔴 URGENT
   • Dépense exceptionnelle non budgétée
     Réparation chaudière: 3,500 €
     Date: 15/01/2026

🟡 ATTENTION
   • Taux d'impayés supérieur à la normale
     7% vs objectif 3%
   
   • Dépassement budget maintenance
     +12% vs prévisionnel

🟢 INFO
   • Trésorerie en hausse
     +5,000 € vs mois précédent
```

**Temps estimé pour ce scénario:** 2-3 heures/mois  
**Fréquence:** Mensuelle

---

## 💼 SCÉNARIO 4: Comptable Externe

### Profil Utilisateur
**Nom:** Sophie Laurent  
**Rôle:** Expert-Comptable  
**Cabinet:** Expertise Comptable Laurent & Associés  
**Clients:** 8 copropriétés gérées par Marie Dubois

---

### 📑 Scénario 4.1 - Saisie Comptable Mensuelle

**Contexte:** Sophie effectue la saisie comptable mensuelle.

#### Étapes Détaillées

**1. Export des Données**

```graphql
query ExportAccountingData {
  exportTransactions(
    copropertyId: "uuid-jardins-du-parc"
    startDate: "2026-01-01"
    endDate: "2026-01-31"
    format: FEC
  ) {
    downloadUrl
    recordsCount
  }
}
```

**Format FEC (Fichier des Écritures Comptables):**
```csv
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
VE|Ventes|VE00001|20260115|411001|Clients|MARTIN|Jean MARTIN|INV-2026-Q1-A101|20260115|Charges T1 2026 - Lot A101|1008.00|0.00|||20260115|||
BQ|Banque|BQ00001|20260129|512001|Banque|MARTIN|Jean MARTIN|REC-20260129-001|20260129|Règlement Facture INV-2026-Q1-A101|0.00|1008.00|||20260129|||
```

**2. Rapprochement Bancaire**

```graphql
query GetBankReconciliation {
  bankTransactions(
    copropertyId: "uuid-jardins-du-parc"
    accountNumber: "FR76XXXX..."
    startDate: "2026-01-01"
    endDate: "2026-01-31"
  ) {
    date
    label
    amount
    reconciled
    matchedInvoice {
      invoiceNumber
      ownerName
    }
  }
}
```

**3. Génération des Journaux Comptables**

```graphql
query GenerateAccountingJournals {
  accountingJournals(
    copropertyId: "uuid-jardins-du-parc"
    month: 1
    year: 2026
  ) {
    salesJournal {
      entries
      total
    }
    purchaseJournal {
      entries
      total
    }
    bankJournal {
      entries
      total
    }
    variousJournal {
      entries
      total
    }
  }
}
```

**Temps estimé pour ce scénario:** 3-4 heures/mois  
**Fréquence:** Mensuelle

---

### 📊 Scénario 4.2 - Clôture Annuelle

**Contexte:** Sophie prépare le bilan annuel de la copropriété.

#### Étapes Détaillées

**1. Génération du Bilan**

```graphql
query GenerateAnnualBalance {
  annualBalance(
    copropertyId: "uuid-jardins-du-parc"
    year: 2025
  ) {
    assets {
      treasuryAccount
      ownerReceivables
      prepaidExpenses
      total
    }
    liabilities {
      supplierPayables
      deferredIncome
      reserves
      total
    }
    balanceCheck
  }
}
```

**2. Compte de Résultat**

```graphql
query GenerateIncomeStatement {
  incomeStatement(
    copropertyId: "uuid-jardins-du-parc"
    year: 2025
  ) {
    revenue {
      charges
      exceptionalIncome
      total
    }
    expenses {
      maintenance
      utilities
      insurance
      administration
      total
    }
    result
  }
}
```

**3. Annexes et Notes**

```graphql
mutation CreateAccountingNotes {
  createAccountingNotes(
    copropertyId: "uuid-jardins-du-parc"
    year: 2025
    notes: [
      {
        category: "GENERAL"
        title: "Périmètre et méthodes comptables"
        content: "La comptabilité est tenue en partie double..."
      },
      {
        category: "RECEIVABLES"
        title: "Créances copropriétaires"
        content: "Total: 3,200€ dont 1,500€ > 90 jours..."
      },
      {
        category: "LIABILITIES"
        title: "Dettes fournisseurs"
        content: "Total: 2,800€ toutes à échéance < 30 jours..."
      }
    ]
  ) {
    notesCreated
  }
}
```

**Temps estimé pour ce scénario:** 8-12 heures/an  
**Fréquence:** Annuelle

---

## 🛠️ SCÉNARIO 5: Administrateur Système

### Profil Utilisateur
**Nom:** Thomas Durand  
**Rôle:** Administrateur Système MYB  
**Responsabilité:** Maintenance plateforme, support niveau 3

---

### ⚙️ Scénario 5.1 - Gestion des Utilisateurs et Permissions

#### Étapes Détaillées

**1. Création d'un Nouveau Syndic**

```graphql
mutation CreateSyndicUser {
  createUser(input: {
    email: "nouveau.syndic@gestion-immo.fr"
    firstName: "Laurent"
    lastName: "Mercier"
    role: COPROPERTY_SYNDIC
    permissions: [
      "coproperty:create",
      "coproperty:update",
      "coproperty:delete",
      "charges:manage",
      "invoices:manage",
      "payments:view",
      "reports:generate"
    ]
    notificationPreferences: {
      email: true
      sms: true
      push: true
    }
  }) {
    id
    email
    role
  }
}
```

**2. Attribution des Copropriétés**

```graphql
mutation AssignCoproperties {
  assignCopropertiesToManager(
    userId: "uuid-laurent-mercier"
    copropertyIds: [
      "uuid-residence-a",
      "uuid-residence-b"
    ]
  ) {
    assigned
  }
}
```

**3. Gestion des Permissions Spécifiques**

```graphql
mutation UpdateUserPermissions {
  updatePermissions(
    userId: "uuid-owner-jean"
    permissions: [
      "owner:view-own-data",
      "owner:pay-invoices",
      "owner:create-maintenance-requests",
      "owner:view-documents"
    ]
    restrictions: [
      "cannot-view-other-owners-data",
      "cannot-modify-charges"
    ]
  ) {
    permissionsUpdated
  }
}
```

**Temps estimé pour ce scénario:** 30-45 minutes  
**Fréquence:** Occasionnelle

---

### 📊 Scénario 5.2 - Monitoring et Maintenance

#### Étapes Détaillées

**1. Dashboard d'Administration**

```graphql
query GetSystemMetrics {
  systemMetrics {
    totalUsers
    totalCoproperties
    totalUnits
    totalInvoices
    
    activeUsers24h
    transactionsToday
    apiCallsPerMinute
    
    errorRate
    averageResponseTime
    databaseSize
  }
}
```

**2. Alertes et Incidents**

```graphql
query GetSystemAlerts {
  systemAlerts {
    type
    severity
    message
    timestamp
    affected {
      users
      coproperties
      services
    }
  }
}
```

**Exemples d'alertes:**
```
🔴 CRITIQUE
   • API payment gateway timeout
     Affecté: 12 utilisateurs
     Durée: 5 minutes
     Action: Basculement sur backup gateway

🟡 WARNING
   • Base de données 85% capacité
     Action requise: Augmenter stockage

🟢 INFO
   • Mise à jour planifiée
     Date: 01/02/2026 02:00
     Durée estimée: 30 minutes
```

**Temps estimé pour ce scénario:** 1-2 heures/jour  
**Fréquence:** Quotidienne

---

## 📈 Tableau Récapitulatif des Scénarios

| Rôle | Scénario Principal | Fréquence | Temps | Complexité |
|------|-------------------|-----------|-------|------------|
| **Syndic** | Gestion quotidienne | Quotidienne | 30-45 min | Moyenne |
| **Syndic** | Prise en charge copropriété | Occasionnelle | 2-3 h | Élevée |
| **Syndic** | Reporting financier | Trimestrielle | 4-6 h | Élevée |
| **Copropriétaire** | Consultation portail | Hebdomadaire | 5-10 min | Faible |
| **Copropriétaire** | Paiement facture | Trimestrielle | 3-5 min | Faible |
| **Copropriétaire** | Demande travaux | Occasionnelle | 10-15 min | Moyenne |
| **Conseil Syndical** | Préparation AG | Annuelle | 6-8 h | Élevée |
| **Conseil Syndical** | Contrôle gestion | Mensuelle | 2-3 h | Moyenne |
| **Comptable** | Saisie comptable | Mensuelle | 3-4 h | Moyenne |
| **Comptable** | Clôture annuelle | Annuelle | 8-12 h | Élevée |
| **Admin Système** | Gestion utilisateurs | Occasionnelle | 30-45 min | Moyenne |
| **Admin Système** | Monitoring | Quotidienne | 1-2 h | Moyenne |

---

## 🎯 Indicateurs de Performance par Rôle

### Syndic
- ✅ Temps de réponse demandes < 24h
- ✅ Taux d'encaissement > 95%
- ✅ Satisfaction copropriétaires > 4/5

### Copropriétaire
- ✅ Accès aux documents 24/7
- ✅ Paiement en ligne < 3 minutes
- ✅ Réponse demande travaux < 48h

### Conseil Syndical
- ✅ Rapports financiers à jour
- ✅ Contrôles mensuels effectués
- ✅ AG préparée 30 jours avant

### Comptable
- ✅ Saisie < J+5
- ✅ Rapprochement bancaire mensuel
- ✅ Bilan annuel < J+60

### Admin Système
- ✅ Disponibilité > 99.9%
- ✅ Temps réponse API < 500ms
- ✅ Résolution incidents < 1h

---

## 📞 Support et Formation

**Documentation complète:** [docs/COPROPERTY_MANAGEMENT_DOC.md](./COPROPERTY_MANAGEMENT_DOC.md)  
**Guide utilisateur:** [libs/coproperty-module/README.md](../src/front/myb.front/libs/coproperty-module/README.md)  
**API GraphQL:** http://localhost:8088/graphql

---

**Dernière mise à jour:** 29 Janvier 2026  
**Version:** 1.0  
**Auteur:** Équipe MYB
