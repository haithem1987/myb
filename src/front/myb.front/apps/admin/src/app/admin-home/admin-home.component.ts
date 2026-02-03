import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  requiredRoles: string[];
  color: string;
  available: boolean;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-home">
      <header class="header">
        <div class="header-content">
          <h1>MYB Administration Platform</h1>
          <p class="subtitle">Welcome, {{ userName() }}</p>
          <div class="user-roles">
            <span class="role-badge" *ngFor="let role of userRoles()">
              {{ formatRole(role) }}
            </span>
          </div>
        </div>
        <button class="btn-logout" (click)="logout()">
          <i class="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </header>

      <main class="main-content">
        <h2>Available Services</h2>
        <p class="info-text">Select a service to get started. Services are displayed based on your assigned roles.</p>

        <div class="services-grid">
          <div 
            *ngFor="let service of availableServices()" 
            class="service-card"
            [style.border-left-color]="service.color"
            (click)="navigateToService(service)"
          >
            <div class="service-icon" [style.color]="service.color">
              <i [class]="service.icon"></i>
            </div>
            <div class="service-content">
              <h3>{{ service.title }}</h3>
              <p>{{ service.description }}</p>
              <div class="service-roles">
                <span class="required-role" *ngFor="let role of service.requiredRoles">
                  {{ formatRole(role) }}
                </span>
              </div>
            </div>
            <div class="service-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </div>
        </div>

        <div class="no-services" *ngIf="availableServices().length === 0">
          <i class="bi bi-exclamation-circle"></i>
          <h3>No Services Available</h3>
          <p>You don't have access to any services. Please contact your administrator.</p>
        </div>

        <div class="unavailable-services" *ngIf="unavailableServices().length > 0">
          <h3>Services Requiring Additional Access</h3>
          <div class="services-grid disabled">
            <div 
              *ngFor="let service of unavailableServices()" 
              class="service-card disabled"
              [style.border-left-color]="service.color"
            >
              <div class="service-icon" [style.color]="service.color">
                <i [class]="service.icon"></i>
              </div>
              <div class="service-content">
                <h3>{{ service.title }}</h3>
                <p>{{ service.description }}</p>
                <div class="service-roles">
                  <span class="required-role" *ngFor="let role of service.requiredRoles">
                    {{ formatRole(role) }}
                  </span>
                </div>
              </div>
              <div class="service-lock">
                <i class="bi bi-lock-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-home {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 0;
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem 3rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      color: #1a202c;
      font-size: 2rem;
      font-weight: 700;
    }

    .subtitle {
      color: #4a5568;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .user-roles {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .role-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .btn-logout {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-logout:hover {
      background: #dc2626;
    }

    .main-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .main-content h2 {
      color: white;
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .info-text {
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 2rem 0;
      font-size: 1.1rem;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .service-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      border-left: 4px solid;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .service-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .service-card.disabled:hover {
      transform: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .service-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .service-content {
      flex: 1;
    }

    .service-content h3 {
      margin: 0 0 0.5rem 0;
      color: #1a202c;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .service-content p {
      color: #4a5568;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .service-roles {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .required-role {
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .service-arrow {
      font-size: 1.5rem;
      color: #d1d5db;
      flex-shrink: 0;
      transition: transform 0.2s;
    }

    .service-card:hover .service-arrow {
      transform: translateX(4px);
      color: #9ca3af;
    }

    .service-lock {
      font-size: 1.5rem;
      color: #d1d5db;
      flex-shrink: 0;
    }

    .no-services {
      background: white;
      border-radius: 12px;
      padding: 4rem 2rem;
      text-align: center;
      color: #6b7280;
    }

    .no-services i {
      font-size: 4rem;
      color: #d1d5db;
      margin-bottom: 1rem;
    }

    .no-services h3 {
      color: #1a202c;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .no-services p {
      margin: 0;
      font-size: 1.1rem;
    }

    .unavailable-services {
      margin-top: 3rem;
    }

    .unavailable-services h3 {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      margin: 0 0 1.5rem 0;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }

      .service-card {
        flex-direction: column;
        text-align: center;
      }

      .service-arrow,
      .service-lock {
        align-self: center;
      }
    }
  `]
})
export class AdminHomeComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);

  userName = signal('User');
  userRoles = signal<string[]>([]);

  // Define all available services with their required roles
  private allServices: ServiceCard[] = [
    {
      id: 'coproperty',
      title: 'Coproperty Management',
      description: 'Manage condominiums, units, charges, invoices, and fund calls.',
      icon: 'bi bi-building',
      route: '/coproperty',
      requiredRoles: ['coproperty-syndic', 'coproperty-owner', 'coproperty-council', 'coproperty-accountant'],
      color: '#3b82f6',
      available: false
    },
    {
      id: 'documents',
      title: 'Document Management',
      description: 'Organize and manage documents, contracts, and important files.',
      icon: 'bi bi-file-earmark-text',
      route: '/documents',
      requiredRoles: ['document-manager', 'system-admin'],
      color: '#10b981',
      available: false
    },
    {
      id: 'invoices',
      title: 'Invoice Management',
      description: 'Create, track, and manage invoices and payments.',
      icon: 'bi bi-receipt',
      route: '/invoices',
      requiredRoles: ['invoice-manager', 'coproperty-syndic', 'system-admin'],
      color: '#f59e0b',
      available: false
    },
    {
      id: 'timesheets',
      title: 'Timesheet Management',
      description: 'Track work hours, projects, and employee time.',
      icon: 'bi bi-clock-history',
      route: '/timesheets',
      requiredRoles: ['timesheet-manager', 'employee', 'system-admin'],
      color: '#8b5cf6',
      available: false
    },
    {
      id: 'payments',
      title: 'Payment Processing',
      description: 'Process payments, manage transactions, and financial operations.',
      icon: 'bi bi-credit-card',
      route: '/payments',
      requiredRoles: ['payment-manager', 'coproperty-accountant', 'system-admin'],
      color: '#ef4444',
      available: false
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions across the platform.',
      icon: 'bi bi-people',
      route: '/users',
      requiredRoles: ['system-admin'],
      color: '#6366f1',
      available: false
    }
  ];

  availableServices = computed(() => 
    this.allServices.filter(service => service.available)
  );

  unavailableServices = computed(() => 
    this.allServices.filter(service => !service.available)
  );

  ngOnInit() {
    this.loadUserInfo();
    this.checkServiceAccess();
  }

  private loadUserInfo() {
    try {
      // Get user info from Keycloak token
      const keycloak = (this.keycloakService as any).keycloak;
      if (keycloak?.tokenParsed) {
        const token = keycloak.tokenParsed;
        this.userName.set(token.preferred_username || token.name || 'User');
      }

      // Get user roles
      const roles = this.keycloakService.getRoles();
      this.userRoles.set(roles);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  private checkServiceAccess() {
    const userRoles = this.userRoles();
    
    this.allServices.forEach(service => {
      // Check if user has at least one of the required roles
      service.available = service.requiredRoles.some(requiredRole => 
        userRoles.includes(requiredRole)
      );
    });
  }

  navigateToService(service: ServiceCard) {
    if (service.available) {
      this.router.navigate([service.route]);
    }
  }

  formatRole(role: string): string {
    return role
      .replace('coproperty-', '')
      .replace('system-', '')
      .replace('-', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  logout() {
    this.keycloakService.logout();
  }
}
