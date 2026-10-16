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
    <div class="container-fluid py-3">
      <div class="d-flex align-items-center gap-2 mb-3">
        <i class="bi bi-chat-square-dots fs-4 text-primary"></i>
        <h3 class="mb-0">Communication Hub</h3>
      </div>

      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
            <i class="bi bi-clock-history me-1"></i>Historique
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'campaigns'" (click)="activeTab.set('campaigns')">
            <i class="bi bi-megaphone me-1"></i>Campagnes
          </button>
        </li>
      </ul>

      <app-communication-history *ngIf="activeTab() === 'history'"></app-communication-history>
      <app-communication-campaigns *ngIf="activeTab() === 'campaigns'"></app-communication-campaigns>
    </div>
  `,
})
export class CommunicationHubComponent {
  activeTab = signal<Tab>('history');
}
