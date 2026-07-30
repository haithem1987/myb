import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-accountant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="accountant-layout">
      <aside class="sidebar">
        <div class="logo">
          <img src="assets/MYB-LOGO-dark.png" alt="MYB">
          <span class="role-badge">Comptable</span>
        </div>
        
        <nav class="main-nav">
          <a routerLink="/coproperty/accountant/dashboard" routerLinkActive="active" class="nav-item">
            <i class="bi bi-speedometer2"></i>
            <span>Tableau de bord</span>
          </a>
          <a routerLink="/coproperty/accountant/accounting/entries" routerLinkActive="active" class="nav-item">
            <i class="bi bi-journal-text"></i>
            <span>Écritures</span>
          </a>
          <a routerLink="/coproperty/accountant/accounting/journals" routerLinkActive="active" class="nav-item">
            <i class="bi bi-book"></i>
            <span>Journaux</span>
          </a>
          <a routerLink="/coproperty/accountant/accounting/reconciliation" routerLinkActive="active" class="nav-item">
            <i class="bi bi-arrow-left-right"></i>
            <span>Rapprochement</span>
          </a>
          <a routerLink="/coproperty/accountant/reports/balance-sheet" routerLinkActive="active" class="nav-item">
            <i class="bi bi-table"></i>
            <span>Bilan</span>
          </a>
          <a routerLink="/coproperty/accountant/reports/income-statement" routerLinkActive="active" class="nav-item">
            <i class="bi bi-graph-up-arrow"></i>
            <span>Compte de résultat</span>
          </a>
          <a routerLink="/coproperty/accountant/export" routerLinkActive="active" class="nav-item">
            <i class="bi bi-download"></i>
            <span>Export</span>
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <button class="btn-logout" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i>
            <span>{{ 'navigation.logout' | translate }}</span>
          </button>
        </div>
      </aside>
      
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .accountant-layout {
      display: flex;
      height: 100vh;
      background: #f5f7fa;
    }
    
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #059669 0%, #047857 100%);
      color: white;
      display: flex;
      flex-direction: column;
    }
    
    .logo {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      img {
        height: 36px;
        width: auto;
        object-fit: contain;
      }
    }
    
    .role-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .main-nav {
      flex: 1;
      padding: 20px 0;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .nav-item.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }
    
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .btn-logout {
      width: 100%;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `]
})
export class AccountantLayoutComponent {
  private keycloakService = inject(KeycloakService);
  
  logout(): void {
    this.keycloakService.logout();
  }
}
