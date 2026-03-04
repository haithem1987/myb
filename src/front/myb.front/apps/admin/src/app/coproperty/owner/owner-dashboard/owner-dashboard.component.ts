import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OwnerService, Unit, CopropertyInvoice, InvoiceStatus, CopropertyService, Coproperty } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

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
  private ownerService = inject(OwnerService);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);

  myUnits = signal<OwnerUnit[]>([]);
  pendingInvoices = signal<PendingInvoice[]>([]);
  totalDue = signal(0);
  nextAssembly = signal<Date | null>(null);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadOwnerData();
  }

  private getCurrentUserId(): string | null {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch {
        return null;
      }
    }
    return null;
  }
  
  private loadOwnerData(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.error('[OwnerDashboard] User ID not available');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // Load units, invoices and coproperties in parallel
    forkJoin({
      units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
      invoices: this.ownerService.getMyInvoices(userId).pipe(take(1), catchError(() => of([] as CopropertyInvoice[]))),
      coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([] as Coproperty[]))),
    }).subscribe({
      next: ({ units, invoices, coproperties }) => {
        const copropertyMap = new Map<string, string>(
          coproperties.map((c) => [c.id, c.name])
        );

        // Map units
        this.myUnits.set(units.map(u => {
          const typeLower = (u.unitType ?? '').toLowerCase();
          let type = 'Autre';
          if (typeLower.includes('apart') || typeLower.includes('appartement')) type = 'Appartement';
          else if (typeLower.includes('parking') || typeLower === 'garage') type = 'Parking';
          else if (typeLower.includes('cave') || typeLower.includes('cellar')) type = 'Cave';

          return {
            id: u.id,
            buildingName: copropertyMap.get(u.copropertyId) ?? 'Copropriété',
            unitNumber: u.unitNumber,
            type,
            surface: u.area ?? 0,
            shares: u.shares,
          };
        }));

        // Map invoices - filter pending/overdue
        const pending = invoices.filter(inv =>
          inv.status === InvoiceStatus.PENDING ||
          inv.status === InvoiceStatus.OVERDUE ||
          inv.status === InvoiceStatus.PARTIALLY_PAID
        );
        this.pendingInvoices.set(pending.map(inv => ({
          id: inv.id,
          number: inv.invoiceNumber,
          date: new Date(inv.invoiceDate),
          amount: inv.totalAmount,
          dueDate: new Date(inv.dueDate),
          description: inv.notes || `Facture ${inv.invoiceNumber}`,
        })));

        // Calculate total due
        this.totalDue.set(pending.reduce((sum, inv) => sum + inv.totalAmount, 0));

        this.loading.set(false);
      },
      error: (err) => {
        console.error('[OwnerDashboard] Error loading data:', err);
        this.loading.set(false);
      },
    });
  }
  
  isOverdue(dueDate: Date): boolean {
    return new Date() > new Date(dueDate);
  }
  
  getDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
