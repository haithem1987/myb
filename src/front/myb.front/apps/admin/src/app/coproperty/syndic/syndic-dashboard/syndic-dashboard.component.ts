import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface DashboardStats {
  totalCoproperties: number;
  activeUnits: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  urgentMaintenance: number;
  upcomingFundCalls: number;
}

interface RecentActivity {
  id: string;
  type: 'invoice' | 'maintenance' | 'payment' | 'document';
  title: string;
  description: string;
  timestamp: Date;
  coproperty: string;
}

@Component({
  selector: 'app-syndic-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './syndic-dashboard.component.html',
  styleUrls: ['./syndic-dashboard.component.scss']
})
export class SyndicDashboardComponent implements OnInit {
  stats = signal<DashboardStats>({
    totalCoproperties: 12,
    activeUnits: 450,
    pendingInvoices: 23,
    monthlyRevenue: 125000,
    urgentMaintenance: 3,
    upcomingFundCalls: 5
  });
  
  recentActivities = signal<RecentActivity[]>([]);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  private loadDashboardData(): void {
    // TODO: Load from API
    setTimeout(() => {
      this.recentActivities.set([
        {
          id: '1',
          type: 'invoice',
          title: 'Nouvelle facture',
          description: 'Facture #2024-001 créée pour Résidence Les Jardins',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          coproperty: 'Résidence Les Jardins'
        },
        {
          id: '2',
          type: 'maintenance',
          title: 'Demande urgente',
          description: 'Fuite d\'eau - Appartement 3B',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          coproperty: 'Villa Park'
        },
        {
          id: '3',
          type: 'payment',
          title: 'Paiement reçu',
          description: '€2,500 reçu de M. Dupont',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
          coproperty: 'Résidence Les Jardins'
        }
      ]);
      this.loading.set(false);
    }, 500);
  }
  
  getActivityIcon(type: string): string {
    switch (type) {
      case 'invoice': return 'bi-receipt';
      case 'maintenance': return 'bi-tools';
      case 'payment': return 'bi-cash-coin';
      case 'document': return 'bi-file-text';
      default: return 'bi-circle';
    }
  }
  
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }
}
