import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FundCallService, FundCallExtended } from '../../services/fund-call.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'myb-fund-calls-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './fund-calls-list.component.html',
  styleUrls: ['./fund-calls-list.component.scss'],
})
export class FundCallsListComponent implements OnInit {
  private fundCallService = inject(FundCallService);
  private copropertyService = inject(CopropertyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  fundCalls = signal<FundCallExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterStatus = signal<string>('');

  ngOnInit(): void {
    this.loadCoproperties();
    this.loadAllFundCalls();
  }

  loadCoproperties(): void {
    this.copropertyService.getCoproperties().subscribe({
      next: (data) => {
        this.coproperties.set(data);
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
      }
    });
  }

  loadAllFundCalls(): void {
    this.loading.set(true);
    this.copropertyService.getCoproperties()
      .pipe(
        switchMap((coproperties) => {
          if (coproperties.length === 0) {
            this.fundCalls.set([]);
            return of([]);
          }

          const fundCallRequests = coproperties.map(coproperty =>
            this.fundCallService.getFundCallsByCoproperty(coproperty.id).pipe(
              map(fundCalls => ({
                fundCalls,
                copropertyName: coproperty.name
              }))
            )
          );

          return forkJoin(fundCallRequests).pipe(
            map(results => results.flatMap(result =>
              result.fundCalls.map(fundCall => ({
                ...fundCall,
                copropertyName: result.copropertyName
              } as any))
            ))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (allFundCalls) => {
          this.fundCalls.set(allFundCalls);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading fund calls:', err);
          this.loading.set(false);
        }
      });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    
    if (!copropertyId || copropertyId === 'all') {
      this.loadAllFundCalls();
    } else {
      this.loading.set(true);
      this.fundCallService.getFundCallsByCoproperty(copropertyId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (fundCalls) => {
            const coproperty = this.coproperties().find(c => c.id === copropertyId);
            const fundCallsWithCoproperty = fundCalls.map(fundCall => ({
              ...fundCall,
              copropertyName: coproperty?.name || ''
            } as any));
            this.fundCalls.set(fundCallsWithCoproperty);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error loading fund calls:', err);
            this.loading.set(false);
          }
        });
    }
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  get filteredFundCalls(): FundCallExtended[] {
    let filtered = this.fundCalls();

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(fundCall => 
        fundCall.description?.toLowerCase().includes(term) ||
        (fundCall as any).copropertyName?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.filterStatus()) {
      const isActive = this.filterStatus() === 'active';
      filtered = filtered.filter(fundCall => fundCall.isActive === isActive);
    }

    return filtered;
  }

  getActiveFundCallsCount(): number {
    return this.filteredFundCalls.filter(fc => fc.isActive).length;
  }

  getTotalAmount(): number {
    return this.filteredFundCalls.reduce((sum, fc) => sum + (fc.amount || 0), 0);
  }

  viewFundCall(fundCall: FundCallExtended): void {
    // Navigate to detail view or edit
    this.router.navigate(['/coproperty/syndic/fund-calls', fundCall.id]);
  }

  createFundCall(): void {
    this.router.navigate(['/coproperty/syndic/fund-calls', 'new']);
  }

  editFundCall(fundCall: FundCallExtended): void {
    this.router.navigate(['/coproperty/syndic/fund-calls', fundCall.id, 'edit']);
  }

  deleteFundCall(fundCall: FundCallExtended): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet appel de fonds ?`)) {
      if (fundCall.id) {
        this.fundCallService.deleteFundCall(fundCall.id).subscribe({
          next: () => {
            this.loadAllFundCalls();
          },
          error: (err) => {
            console.error('Error deleting fund call:', err);
            alert('Erreur lors de la suppression de l\'appel de fonds');
          }
        });
      }
    }
  }

  generateInvoices(fundCall: FundCallExtended): void {
    if (!fundCall.id) return;
    
    this.loading.set(true);
    this.fundCallService.generateInvoicesFromFundCall(fundCall.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (invoices) => {
          alert(`${invoices.length} factures ont été générées avec succès`);
          this.loadAllFundCalls();
        },
        error: (err) => {
          console.error('Error generating invoices:', err);
          alert('Erreur lors de la génération des factures');
        }
      });
  }

  getCopropertyName(fundCall: FundCallExtended): string {
    return (fundCall as any).copropertyName || '';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }
}
