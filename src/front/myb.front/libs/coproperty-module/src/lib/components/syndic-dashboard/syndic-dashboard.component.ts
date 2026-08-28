import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopropertyService } from 'libs/coproperty-module/src/lib/services/coproperty.service';
import { UnitService } from 'libs/coproperty-module/src/lib/services/unit.service';
import { ChargeService } from 'libs/coproperty-module/src/lib/services/charge.service';
import { CurrencyService } from 'libs/coproperty-module/src/lib/services/currency.service';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, timeout, catchError } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface DashboardStats {
  totalCoproperties: number;
  totalUnits: number;
  activeUnits: number;
  totalOwners: number;
  activeCharges: number;
  occupancyRate: number;
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
  selector: 'myb-coproperty-syndic-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './syndic-dashboard.component.html',
  styleUrls: ['./syndic-dashboard.component.scss']
})
export class SyndicDashboardComponent implements OnInit {
  private copropertyService = inject(CopropertyService);
  private unitService = inject(UnitService);
  private chargeService = inject(ChargeService);
  private currencyService = inject(CurrencyService);
  private keycloakService = inject(KeycloakService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  
  stats = signal<DashboardStats>({
    totalCoproperties: 0,
    totalUnits: 0,
    activeUnits: 0,
    totalOwners: 0,
    activeCharges: 0,
    occupancyRate: 0
  });
  
  recentActivities = signal<RecentActivity[]>([]);
  totalBudgetDisplay = signal('');
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadDashboardData();
  }

  formatAmount(amount: number, currency?: string): string {
    return this.currencyService.formatAmount(amount, currency);
  }
  
  private loadDashboardData(): void {
    this.loading.set(true);
    
    const managerId = this.keycloakService.getSyndicManagerId();
    const coproperties$ = this.copropertyService.getCoproperties(managerId).pipe(
      take(1),
      timeout(10000),
      catchError(err => {
        console.error('[Dashboard] Error loading coproperties:', err);
        return of([]);
      })
    );
    
    const units$ = this.unitService.getAllUnitsBySyndic(managerId).pipe(
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
    
    forkJoin({
      coproperties: coproperties$,
      units: units$,
      charges: charges$
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ coproperties, units, charges }) => {
        const activeCharges = charges.filter(c => c.isActive);
        const totalsByCurrency = new Map<string, number>();
        for (const charge of activeCharges) {
          const currency = charge.currency
            ?? coproperties.find(coproperty => coproperty.id === charge.copropertyId)?.currency
            ?? this.currencyService.current;
          totalsByCurrency.set(
            currency,
            (totalsByCurrency.get(currency) ?? 0) + (charge.totalAmount || 0)
          );
        }
        this.totalBudgetDisplay.set(
          totalsByCurrency.size > 0
            ? [...totalsByCurrency.entries()]
                .map(([currency, amount]) => this.formatAmount(amount, currency))
                .join(' · ')
            : this.formatAmount(0)
        );
        const totalOwners = units.filter(u => u.isOccupied).length;
        const totalUnits = units.length;
        const activeUnits = units.filter(u => u.isOccupied).length;
        const occupancyRate = totalUnits > 0 ? Math.round((activeUnits / totalUnits) * 100) : 0;
        
        this.stats.set({
          totalCoproperties: coproperties.length,
          totalUnits,
          activeUnits,
          totalOwners,
          activeCharges: activeCharges.length,
          occupancyRate
        });
        
        // Create recent activities from latest charges
        const activities: RecentActivity[] = [];
        const sortedCharges = [...charges]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5);
        
        sortedCharges.forEach(charge => {
          const coproperty = coproperties.find(c => c.id === charge.copropertyId);
          const copropertyName = coproperty?.name || this.translate.instant('coproperty.syndicDashboard.unknownCoproperty');
          
          activities.push({
            id: charge.id || '',
            type: 'budget',
            title: 'coproperty.syndicDashboard.activity.budgetCreated',
            description: `${charge.name} - ${this.formatAmount(
              charge.totalAmount,
              charge.currency ?? coproperty?.currency
            )}`,
            timestamp: charge.createdAt ? new Date(charge.createdAt) : new Date(),
            coproperty: copropertyName
          });
        });
        
        this.recentActivities.set(activities);
        this.loading.set(false);
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
    
    if (minutes < 60) {
      return this.translate.instant('coproperty.syndicDashboard.activity.minutesAgo', { count: minutes });
    }
    if (hours < 24) {
      return this.translate.instant('coproperty.syndicDashboard.activity.hoursAgo', { count: hours });
    }
    return this.translate.instant('coproperty.syndicDashboard.activity.daysAgo', { count: days });
  }
}
