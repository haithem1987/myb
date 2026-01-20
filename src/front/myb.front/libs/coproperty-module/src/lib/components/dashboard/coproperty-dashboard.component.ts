import { Component, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CopropertyService } from '../../services/coproperty.service';
import { CreateFundCallInput } from '../../models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface Activity {
  type: 'invoice_created' | 'charge_distributed' | 'payment_recorded';
  description: string;
  date: Date;
}

@Component({
  selector: 'myb-coproperty-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, FormsModule],
  templateUrl: './coproperty-dashboard.component.html',
  styleUrls: ['./coproperty-dashboard.component.scss'],
})
export class CopropertyDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // KPIs - using signals for reactivity
  readonly totalCoproperties = signal<number>(0);
  readonly totalUnits = signal<number>(0);
  readonly totalBalance = signal<number>(0);
  readonly totalCharges = signal<number>(0);
  readonly pendingMaintenance = signal<number>(0);

  // Charts data
  readonly treasuryData = signal<number[]>([]);
  readonly treasuryLabels = signal<string[]>([]);
  readonly chargesData = signal<number[]>([]);
  readonly chargesLabels = signal<string[]>([]);

  // Chart instances
  private treasuryChart: Chart | null = null;
  private chargesChart: Chart | null = null;

  // Recent activities
  readonly recentActivities = signal<Activity[]>([]);

  // Action panels
  readonly showCreateAssembly = signal<boolean>(false);
  readonly showCreateFundCall = signal<boolean>(false);

  // Assembly form
  readonly assemblyTitle = signal<string>('');
  readonly assemblyDate = signal<string>('');
  readonly assemblyAgenda = signal<string>('');

  // Fund call form
  readonly fundCallAmount = signal<number>(0);
  readonly fundCallDueDate = signal<string>('');
  readonly fundCallDescription = signal<string>('');

  // Loading state
  readonly isLoading = signal<boolean>(false);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private copropertyService: CopropertyService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const action = params.get('action');
        this.showCreateAssembly.set(action === 'createAssembly');
        this.showCreateFundCall.set(action === 'createFundCall');
      });
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Destroy chart instances
    if (this.treasuryChart) {
      this.treasuryChart.destroy();
    }
    if (this.chargesChart) {
      this.chargesChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Load dashboard stats
    this.copropertyService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.totalCoproperties.set(stats.totalCoproperties);
          this.totalUnits.set(stats.totalUnits);
          this.totalBalance.set(stats.totalBalance);
          this.totalCharges.set(stats.totalCharges);
          this.pendingMaintenance.set(stats.pendingMaintenance);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard stats:', err);
          this.isLoading.set(false);
          // Keep mock data on error
          this.loadMockData();
        }
      });

    // Load treasury evolution - using first coproperty as default
    // In production, this should come from route params or user selection
    this.copropertyService.getCoproperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coproperties) => {
          if (coproperties.length > 0) {
            const firstCopropertyId = coproperties[0].id;
            
            // Load treasury evolution
            this.copropertyService.getTreasuryEvolution(firstCopropertyId, 12)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (treasuryData) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  this.treasuryLabels.set(
                    treasuryData.map(d => monthNames[d.month - 1])
                  );
                  this.treasuryData.set(
                    treasuryData.map(d => d.balance)
                  );
                  this.updateTreasuryChart();
                },
                error: (err) => {
                  console.error('Error loading treasury evolution:', err);
                  this.loadMockTreasuryData();
                  this.updateTreasuryChart();
                }
              });

            // Load charges distribution
            this.copropertyService.getChargesDistribution(firstCopropertyId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (chargesData) => {
                  this.chargesLabels.set(
                    chargesData.map(c => c.chargeType)
                  );
                  this.chargesData.set(
                    chargesData.map(c => c.amount)
                  );
                  this.updateChargesChart();
                },
                error: (err) => {
                  console.error('Error loading charges distribution:', err);
                  this.loadMockChargesData();
                  this.updateChargesChart();
                }
              });
          } else {
            // No coproperties, use mock data
            this.loadMockData();
            this.updateTreasuryChart();
            this.updateChargesChart();
          }
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
          this.loadMockData();
          this.updateTreasuryChart();
          this.updateChargesChart();
        }
      });

    // Mock recent activities (will be replaced with real API later)
    this.loadMockActivities();
  }

  private initializeCharts(): void {
    this.initializeTreasuryChart();
    this.initializeChargesChart();
  }

  private initializeTreasuryChart(): void {
    const canvas = document.getElementById('treasuryChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Treasury chart canvas not found');
      return;
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.treasuryLabels(),
        datasets: [{
          label: 'Treasury Balance',
          data: this.treasuryData(),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value: number | string) => '€' + Number(value).toLocaleString()
            }
          }
        }
      }
    };

    this.treasuryChart = new Chart(canvas, config);
  }

  private initializeChargesChart(): void {
    const canvas = document.getElementById('chargesChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Charges chart canvas not found');
      return;
    }

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: this.chargesLabels(),
        datasets: [{
          data: this.chargesData(),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: €${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    };

    this.chargesChart = new Chart(canvas, config);
  }

  private updateTreasuryChart(): void {
    if (this.treasuryChart) {
      this.treasuryChart.data.labels = this.treasuryLabels();
      this.treasuryChart.data.datasets[0].data = this.treasuryData();
      this.treasuryChart.update();
    }
  }

  private updateChargesChart(): void {
    if (this.chargesChart) {
      this.chargesChart.data.labels = this.chargesLabels();
      this.chargesChart.data.datasets[0].data = this.chargesData();
      this.chargesChart.update();
    }
  }

  private loadMockData(): void {
    this.totalCoproperties.set(12);
    this.totalUnits.set(156);
    this.totalBalance.set(45230.50);
    this.totalCharges.set(12500.00);
    this.pendingMaintenance.set(8);
    this.loadMockTreasuryData();
    this.loadMockChargesData();
  }

  private loadMockTreasuryData(): void {
    this.treasuryLabels.set(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
    this.treasuryData.set([35000, 36500, 38200, 39000, 40500, 42000, 42500, 43000, 43800, 44500, 44800, 45230]);
  }

  private loadMockChargesData(): void {
    this.chargesLabels.set(['Générales', 'Spéciales', 'Travaux']);
    this.chargesData.set([7500, 3200, 1800]);
  }

  private loadMockActivities(): void {
    this.recentActivities.set([
      { 
        type: 'invoice_created', 
        description: 'Invoice created for Apt 101', 
        date: new Date(Date.now() - 2 * 60 * 60 * 1000) 
      },
      { 
        type: 'charge_distributed', 
        description: 'Q1 2026 charges distributed', 
        date: new Date(Date.now() - 5 * 60 * 60 * 1000) 
      },
      { 
        type: 'payment_recorded', 
        description: 'Payment received from Unit 205', 
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) 
      },
    ]);
  }

  createFundCall(): void {
    this.router.navigate(['/admin/coproperties'], { queryParams: { action: 'createFundCall' } });
  }

  createAssembly(): void {
    this.router.navigate(['/admin/coproperties'], { queryParams: { action: 'createAssembly' } });
  }

  generateReport(): void {
    alert('Report generation not yet implemented');
  }

  closeActionPanel(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null },
      queryParamsHandling: 'merge',
    });
  }

  saveAssembly(): void {
    if (!this.assemblyTitle() || !this.assemblyDate()) {
      alert('Please fill in Title and Date');
      return;
    }

    this.isLoading.set(true);
    const input = {
      title: this.assemblyTitle(),
      date: new Date(this.assemblyDate()),
      agenda: this.assemblyAgenda() || undefined,
    };

    // Assembly feature not implemented on backend
    alert('Assembly feature is not yet available');
    this.isLoading.set(false);
  }

  saveFundCall(): void {
    if (!this.fundCallAmount() || !this.fundCallDueDate()) {
      alert('Please fill in Amount and Due Date');
      return;
    }

    this.isLoading.set(true);
    const input: CreateFundCallInput = {
      amount: this.fundCallAmount(),
      dueDate: new Date(this.fundCallDueDate()),
      description: this.fundCallDescription() || undefined,
    };
console.log('Creating fund call with input:', input);
    this.copropertyService.createFundCall(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Fund call created successfully');
          this.resetFundCallForm();
          this.closeActionPanel();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error creating fund call:', err);
          alert('Failed to create fund call');
          this.isLoading.set(false);
        }
      });
  }

  private resetAssemblyForm(): void {
    this.assemblyTitle.set('');
    this.assemblyDate.set('');
    this.assemblyAgenda.set('');
  }

  private resetFundCallForm(): void {
    this.fundCallAmount.set(0);
    this.fundCallDueDate.set('');
    this.fundCallDescription.set('');
  }

  getActivityIcon(type: Activity['type']): string {
    switch (type) {
      case 'invoice_created':
        return 'receipt';
      case 'charge_distributed':
        return 'trending_up';
      case 'payment_recorded':
        return 'check_circle';
      default:
        const exhaustiveCheck: never = type;
        return exhaustiveCheck;
    }
  }

  getActivityClass(type: Activity['type']): string {
    switch (type) {
      case 'invoice_created':
        return 'badge-warning';
      case 'charge_distributed':
        return 'badge-info';
      case 'payment_recorded':
        return 'badge-success';
      default:
        const exhaustiveCheck: never = type;
        return exhaustiveCheck;
    }
  }
}
