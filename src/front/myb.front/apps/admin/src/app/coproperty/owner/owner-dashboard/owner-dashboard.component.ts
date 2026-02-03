import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface OwnerUnit {
  id: string;
  buildingName: string;
  unitNumber: string;
  type: string;
  surface: number;
  shares: number;
}

interface PendingInvoice {
  id: string;
  number: string;
  date: Date;
  amount: number;
  dueDate: Date;
  description: string;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit {
  myUnits = signal<OwnerUnit[]>([]);
  pendingInvoices = signal<PendingInvoice[]>([]);
  totalDue = signal(0);
  nextAssembly = signal<Date | null>(null);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadOwnerData();
  }
  
  private loadOwnerData(): void {
    // TODO: Load from API
    setTimeout(() => {
      this.myUnits.set([
        {
          id: '1',
          buildingName: 'Résidence Les Jardins',
          unitNumber: 'Apt 3B',
          type: 'Appartement',
          surface: 75,
          shares: 125
        },
        {
          id: '2',
          buildingName: 'Villa Park',
          unitNumber: 'Parking P12',
          type: 'Parking',
          surface: 15,
          shares: 25
        }
      ]);
      
      this.pendingInvoices.set([
        {
          id: '1',
          number: 'FAC-2026-001',
          date: new Date('2026-01-15'),
          amount: 850,
          dueDate: new Date('2026-02-15'),
          description: 'Charges trimestrielles Q1 2026'
        },
        {
          id: '2',
          number: 'FAC-2026-002',
          date: new Date('2026-01-20'),
          amount: 150,
          dueDate: new Date('2026-02-20'),
          description: 'Travaux cage d\'escalier'
        }
      ]);
      
      this.totalDue.set(1000);
      this.nextAssembly.set(new Date('2026-03-15'));
      this.loading.set(false);
    }, 500);
  }
  
  isOverdue(dueDate: Date): boolean {
    return new Date() > dueDate;
  }
  
  getDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
