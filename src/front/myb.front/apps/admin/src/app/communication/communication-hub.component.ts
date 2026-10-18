import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunicationHistoryComponent } from './history/communication-history.component';
import { CommunicationCampaignsComponent } from './campaigns/communication-campaigns.component';

type Tab = 'history' | 'campaigns';

@Component({
  selector: 'app-communication-hub',
  standalone: true,
  imports: [CommonModule, CommunicationHistoryComponent, CommunicationCampaignsComponent],
  template: `
    <div class="page-content-inner">
      <div class="d-flex align-items-center gap-2 mb-4">
        <div class="settings-icon">
          <i class="bi bi-chat-square-dots"></i>
        </div>
        <div>
          <h2 class="mb-0 fs-5 fw-semibold">Communication</h2>
          <p class="text-muted small mb-0">Historique des envois et campagnes</p>
        </div>
      </div>

      <div class="settings-tabs mb-4">
        <button class="settings-tab" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
          <i class="bi bi-clock-history"></i>Historique
        </button>
        <button class="settings-tab" [class.active]="activeTab() === 'campaigns'" (click)="activeTab.set('campaigns')">
          <i class="bi bi-megaphone"></i>Campagnes
        </button>
      </div>

      <app-communication-history *ngIf="activeTab() === 'history'"></app-communication-history>
      <app-communication-campaigns *ngIf="activeTab() === 'campaigns'"></app-communication-campaigns>
    </div>
  `,
  styles: [`
    .settings-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 0;
    }
    .settings-tab {
      position: relative;
      padding: 0.625rem 1.25rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      border-radius: 6px 6px 0 0;
      cursor: pointer;
      color: #6c757d;
      font-weight: 500;
      font-size: 0.9rem;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .settings-tab:hover { color: #0d6efd; background: #f0f4ff; }
    .settings-tab.active { color: #0d6efd; border-bottom-color: #0d6efd; background: #f0f4ff; }
    .settings-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: #e8f0fe; color: #1a73e8;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; flex-shrink: 0;
    }
  `]
})
export class CommunicationHubComponent {
  activeTab = signal<Tab>('history');
}
