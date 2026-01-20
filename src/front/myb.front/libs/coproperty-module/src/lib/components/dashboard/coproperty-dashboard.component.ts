import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'myb-coproperty-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule],
  templateUrl: './coproperty-dashboard.component.html',
  styleUrls: ['./coproperty-dashboard.component.scss'],
})
export class CopropertyDashboardComponent implements OnInit {
  // KPIs
  totalCoproperties: number = 0;
  totalUnits: number = 0;
  totalBalance: number = 0;
  totalCharges: number = 0;
  pendingMaintenance: number = 0;

  // Charts data
  treasuryData: number[] = [];
  treasuryLabels: string[] = [];
  chargesData: number[] = [];
  chargesLabels: string[] = [];

  // Recent activities
  recentActivities: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // TODO: Implement GraphQL queries for:
    // - Total coproperties count
    // - Total units count
    // - Financial balance
    // - Charges to collect
    // - Pending maintenance requests
    // - Treasury evolution (12 months)
    // - Charges distribution
    // - Recent activities

    // Mock data for now
    this.totalCoproperties = 12;
    this.totalUnits = 156;
    this.totalBalance = 45230.50;
    this.totalCharges = 12500.00;
    this.pendingMaintenance = 8;

    this.treasuryLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.treasuryData = [35000, 36500, 38200, 39000, 40500, 42000, 42500, 43000, 43800, 44500, 44800, 45230];

    this.chargesLabels = ['Générales', 'Spéciales', 'Travaux'];
    this.chargesData = [7500, 3200, 1800];

    this.recentActivities = [
      { type: 'invoice_created', description: 'Invoice created for Apt 101', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'charge_distributed', description: 'Q1 2026 charges distributed', date: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { type: 'payment_recorded', description: 'Payment received from Unit 205', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ];
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

  getActivityIcon(type: string): string {
    switch (type) {
      case 'invoice_created':
        return 'receipt';
      case 'charge_distributed':
        return 'trending_up';
      case 'payment_recorded':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  getActivityClass(type: string): string {
    switch (type) {
      case 'invoice_created':
        return 'badge-warning';
      case 'charge_distributed':
        return 'badge-info';
      case 'payment_recorded':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }
}
