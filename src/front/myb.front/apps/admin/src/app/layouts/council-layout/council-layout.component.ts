import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-council-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="council-layout">
      <aside class="sidebar">
        <div class="logo">
          <img src="assets/MYB-LOGO-dark.png" alt="MYB">
          <span class="role-badge">Conseil Syndical</span>
        </div>
        
        <nav class="main-nav">
          <a routerLink="/coproperty/council/dashboard" routerLinkActive="active" class="nav-item">
            <i class="bi bi-speedometer2"></i>
            <span>Tableau de bord</span>
          </a>
          <a routerLink="/coproperty/council/financial-control" routerLinkActive="active" class="nav-item">
            <i class="bi bi-cash-stack"></i>
            <span>Contrôle Financier</span>
          </a>
          <a routerLink="/coproperty/council/contracts" routerLinkActive="active" class="nav-item">
            <i class="bi bi-file-earmark-text"></i>
            <span>Contrats</span>
          </a>
          <a routerLink="/coproperty/council/general-assembly" routerLinkActive="active" class="nav-item">
            <i class="bi bi-people"></i>
            <span>Assemblées Générales</span>
          </a>
          <a routerLink="/coproperty/council/reports" routerLinkActive="active" class="nav-item">
            <i class="bi bi-graph-up"></i>
            <span>Rapports</span>
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
    .council-layout {
      display: flex;
      height: 100vh;
      background: #f5f7fa;
    }
    
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%);
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
export class CouncilLayoutComponent {
  private keycloakService = inject(KeycloakService);
  
  logout(): void {
    this.keycloakService.logout();
  }
}
