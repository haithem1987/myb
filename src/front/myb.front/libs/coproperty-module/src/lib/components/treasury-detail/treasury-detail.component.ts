import { Component, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { TreasuryDashboard } from '../../models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'myb-treasury-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, FormsModule],
  templateUrl: './treasury-detail.component.html',
  styleUrls: ['./treasury-detail.component.scss'],
})
export class TreasuryDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly treasury = signal<TreasuryDashboard | null>(null);
  readonly activeTab = signal<'overview' | 'real' | 'accounting' | 'evolution'>('overview');
  readonly isLoading = signal(true);
  readonly selectedMonths = signal(12);

  private evolutionChart: Chart | null = null;
  private expensesChart: Chart | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private copropertyService: CopropertyService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'real' || tab === 'accounting' || tab === 'evolution') {
      this.activeTab.set(tab);
    }
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.evolutionChart?.destroy();
    this.expensesChart?.destroy();
  }

  switchTab(tab: 'overview' | 'real' | 'accounting' | 'evolution'): void {
    this.activeTab.set(tab);
    if (tab === 'evolution' || tab === 'overview') {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  getExpenseColor(index: number): string {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    return colors[index % colors.length];
  }

  private loadData(): void {
    this.isLoading.set(true);
    // Mock data for now
    this.loadMockData();
  }

  private loadMockData(): void {
    this.treasury.set({
      copropertyId: 'mock-id',
      copropertyName: 'Résidence Les Jardins',
      realTreasury: {
        openingBalance: 38000,
        totalEncaissements: 15200,
        totalDecaissements: 7970,
        currentBalance: 45230.50,
      },
      accountingTreasury: {
        totalChargesEngaged: 12500,
        totalInvoiced: 18500,
        totalCollected: 15200,
        totalOutstanding: 3300,
        totalOverdue: 1850,
        accountingBalance: 2700,
      },
      workingCapitalGap: 42530.50,
      collectionRate: 82.2,
      evolution: [
        { month: 'Jan 2026', date: new Date('2026-01-01'), amount: 35000 },
        { month: 'Fév 2026', date: new Date('2026-02-01'), amount: 36500 },
        { month: 'Mar 2026', date: new Date('2026-03-01'), amount: 38200 },
        { month: 'Avr 2026', date: new Date('2026-04-01'), amount: 39000 },
        { month: 'Mai 2026', date: new Date('2026-05-01'), amount: 40500 },
        { month: 'Jun 2026', date: new Date('2026-06-01'), amount: 42000 },
        { month: 'Jul 2026', date: new Date('2026-07-01'), amount: 42500 },
        { month: 'Aoû 2026', date: new Date('2026-08-01'), amount: 43000 },
        { month: 'Sep 2026', date: new Date('2026-09-01'), amount: 43800 },
        { month: 'Oct 2026', date: new Date('2026-10-01'), amount: 44500 },
        { month: 'Nov 2026', date: new Date('2026-11-01'), amount: 44800 },
        { month: 'Déc 2026', date: new Date('2026-12-01'), amount: 45230 },
      ],
      expensesByType: [
        { category: 'Maintenance', amount: 4500, percentage: 36 },
        { category: 'Nettoyage', amount: 3200, percentage: 25.6 },
        { category: 'Assurance', amount: 2800, percentage: 22.4 },
        { category: 'Électricité', amount: 2000, percentage: 16 },
      ],
    });
    this.isLoading.set(false);
    setTimeout(() => this.initCharts(), 200);
  }

  private initCharts(): void {
    this.initEvolutionChart();
    this.initExpensesChart();
  }

  private initEvolutionChart(): void {
    const canvas = document.getElementById('treasuryEvolutionChart') as HTMLCanvasElement;
    if (!canvas || !this.treasury()) return;

    this.evolutionChart?.destroy();

    const data = this.treasury()!;
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: data.evolution.map(e => e.month),
        datasets: [{
          label: 'Trésorerie Réelle',
          data: data.evolution.map(e => e.amount),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${this.currencySymbol}${Number(ctx.parsed.y).toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: (v) => this.currencySymbol + Number(v).toLocaleString() }
          }
        }
      }
    };

    this.evolutionChart = new Chart(canvas, config);
  }

  private initExpensesChart(): void {
    const canvas = document.getElementById('expensesBreakdownChart') as HTMLCanvasElement;
    if (!canvas || !this.treasury()) return;

    this.expensesChart?.destroy();

    const data = this.treasury()!;
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.expensesByType.map(e => e.category),
        datasets: [{
          data: data.expensesByType.map(e => e.amount),
          backgroundColor: colors.slice(0, data.expensesByType.length),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = data.expensesByType[ctx.dataIndex]?.percentage ?? 0;
                return `${ctx.label}: ${this.currencySymbol}${Number(ctx.parsed).toLocaleString()} (${pct.toFixed(1)}%)`;
              }
            }
          }
        }
      }
    };

    this.expensesChart = new Chart(canvas, config);
  }
}
