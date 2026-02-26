import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopropertyService } from 'libs/coproperty-module/src/lib/services/coproperty.service';
import { UnitService } from 'libs/coproperty-module/src/lib/services/unit.service';
import { ChargeService } from 'libs/coproperty-module/src/lib/services/charge.service';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, timeout, catchError } from 'rxjs/operators';

interface DashboardStats {
  totalCoproperties: number;
  activeUnits: number;
  totalBudget: number;
  totalOwners: number;
}

interface RecentActivity {
  id: string;
  type: 'invoice' | 'maintenance' | 'payment' | 'document' | 'budget' | 'fundcall';
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
  private copropertyService = inject(CopropertyService);
  private unitService = inject(UnitService);
  private chargeService = inject(ChargeService);
  private destroyRef = inject(DestroyRef);
  
  stats = signal<DashboardStats>({
    totalCoproperties: 0,
    activeUnits: 0,
    totalBudget: 0,
    totalOwners: 0
  });
  
  recentActivities = signal<RecentActivity[]>([]);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  private loadDashboardData(): void {
    this.loading.set(true);
    console.log('[Dashboard] Loading dashboard data...');
    console.log('[Dashboard] Services:', {
      coproperty: !!this.copropertyService,
      unit: !!this.unitService,
      charge: !!this.chargeService
    });
    
    // Load real data from GraphQL with timeout and error handling
    const coproperties$ = this.copropertyService.getCoproperties().pipe(
      take(1),
      timeout(10000),
      catchError(err => {
        console.error('[Dashboard] Error loading coproperties:', err);
        return of([]);
      })
    );
    
    const units$ = this.unitService.getAllUnits().pipe(
      take(1),
      timeout(10000),
      catchError(err => {
        console.error('[Dashboard] Error loading units:', err);
        return of([]);
      })
    );
    
    const charges$ = this.chargeService.getAllCharges().pipe(
      take(1),
      timeout(10000),
      catchError(err => {
        console.error('[Dashboard] Error loading charges:', err);
        return of([]);
      })
    );
    
    console.log('[Dashboard] Starting forkJoin...');
    
    forkJoin({
      coproperties: coproperties$,
      units: units$,
      charges: charges$
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ coproperties, units, charges }) => {
        console.log('[Dashboard] Data received:', {
          coproperties: coproperties.length,
          units: units.length,
          charges: charges.length
        });
        
        // Calculate total budget from all active charges
        const totalBudget = charges
          .filter(c => c.isActive)
          .reduce((sum, charge) => sum + (charge.totalAmount || 0), 0);
        
        console.log('[Dashboard] Total budget:', totalBudget);
        
        // Count unique owners from units (simplified - using number of occupied units as proxy)
        const totalOwners = units.filter(u => u.isOccupied).length;
        
        this.stats.set({
          totalCoproperties: coproperties.length,
          activeUnits: units.filter(u => u.isOccupied).length,
          totalBudget: totalBudget,
          totalOwners: totalOwners
        });
        
        console.log('[Dashboard] Stats updated:', this.stats());
        
        // Create recent activities from latest charges
        const activities: RecentActivity[] = [];
        
        // Get latest charges sorted by date
        const sortedCharges = [...charges]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5);
        
        sortedCharges.forEach(charge => {
          const coproperty = coproperties.find(c => c.id === charge.copropertyId);
          const copropertyName = coproperty?.name || 'Copropriété inconnue';
          
          activities.push({
            id: charge.id || '',
            type: 'budget',
            title: 'Nouveau budget créé',
            description: `${charge.name} - ${charge.totalAmount}€`,
            timestamp: charge.createdAt ? new Date(charge.createdAt) : new Date(),
            coproperty: copropertyName
          });
        });
        
        this.recentActivities.set(activities);
        console.log('[Dashboard] Activities set:', activities.length);
        
        this.loading.set(false);
        console.log('[Dashboard] Loading complete');
      },
      error: (err) => {
        console.error('[Dashboard] Error loading dashboard data:', err);
        this.loading.set(false);
      }
    });
  }
  
  getActivityIcon(type: string): string {
    switch (type) {
      case 'invoice': return 'bi-receipt';
      case 'maintenance': return 'bi-tools';
      case 'payment': return 'bi-cash-coin';
      case 'document': return 'bi-file-text';
      case 'budget': return 'bi-wallet2';
      case 'fundcall': return 'bi-send';
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
