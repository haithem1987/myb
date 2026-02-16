import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { ToastsContainerComponent, ModalContainerComponent } from '@myb-front/shared-ui';
import { CopropertyService } from '@myb-front/coproperty-module';
import { ChargeService } from '@myb-front/coproperty-module';
import { UnitService } from '@myb-front/coproperty-module';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-syndic-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastsContainerComponent, ModalContainerComponent],
  templateUrl: './syndic-layout.component.html',
  styleUrls: ['./syndic-layout.component.scss']
})
export class SyndicLayoutComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private copropertyService = inject(CopropertyService);
  private chargeService = inject(ChargeService);
  private unitService = inject(UnitService);
  
  // State signals
  unpaidInvoices = signal(0);
  urgentRequests = signal(0);
  managedCoproperties = signal(0);
  totalBudgets = signal(0);
  totalUnits = signal(0);
  totalOwners = signal(0);
  currentUser = signal({ name: 'Marie Dubois', firstName: 'Marie', lastName: 'Dubois', role: 'Syndic' });
  
  // Sidebar state
  isSidebarCollapsed = signal(false);
  
  ngOnInit(): void {
    // Load dashboard statistics
    this.loadStatistics();
  }
  
  private loadStatistics(): void {
    // Load all statistics in parallel using forkJoin
    forkJoin({
      coproperties: this.copropertyService.getCoproperties(),
      charges: this.chargeService.getAllCharges()
    }).subscribe({
      next: (results) => {
        // Set coproperty count
        this.managedCoproperties.set(results.coproperties.length);
        
        // Set budgets count
        this.totalBudgets.set(results.charges.length);
        
        // Load units from all coproperties
        if (results.coproperties.length > 0) {
          const unitRequests = results.coproperties.map(coproperty =>
            this.unitService.getUnitsByCoproperty(coproperty.id)
          );
          
          forkJoin(unitRequests).subscribe({
            next: (unitResults) => {
              const allUnits = unitResults.flat();
              this.totalUnits.set(allUnits.length);
            },
            error: (err) => console.error('Error loading units count:', err)
          });
        }
      },
      error: (err) => console.error('Error loading statistics:', err)
    });
    
    // TODO: Load owners count when service is available
    // For now, using mock data
    this.unpaidInvoices.set(5);
    this.urgentRequests.set(3);
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed.update(value => !value);
  }
  
  logout(): void {
    this.keycloakService.logout();
  }
}
