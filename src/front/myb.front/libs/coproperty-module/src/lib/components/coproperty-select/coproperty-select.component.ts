import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { Coproperty, Unit } from '../../models';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';
import { CopropertyService } from '../../services/coproperty.service';
import { OwnerService } from '../../services/owner.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { UserDropdownComponent } from '@myb-front/shared-ui';

type TargetSpace = 'owner' | 'syndic';

interface SelectableCoproperty extends Coproperty {
  ownedUnitsCount?: number;
}

@Component({
  selector: 'myb-coproperty-select',
  standalone: true,
  imports: [CommonModule, TranslateModule, UserDropdownComponent],
  templateUrl: './coproperty-select.component.html',
  styleUrls: ['./coproperty-select.component.scss']
})
export class CopropertySelectComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly keycloakService = inject(KeycloakService);
  private readonly copropertyService = inject(CopropertyService);
  private readonly ownerService = inject(OwnerService);
  private readonly activeCoproperty = inject(ActiveCopropertyService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly coproperties = signal<SelectableCoproperty[]>([]);
  readonly targetSpace = signal<TargetSpace>('syndic');
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly filteredCoproperties = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.coproperties().filter(coproperty => {
      const matchesSearch = !term ||
        coproperty.name.toLowerCase().includes(term) ||
        coproperty.address.toLowerCase().includes(term) ||
        coproperty.city.toLowerCase().includes(term);
      const matchesStatus = status === 'all' ||
        (status === 'active' ? coproperty.isActive : !coproperty.isActive);
      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    this.init();
  }

  selectAndEnter(copropertyId: string): void {
    const coproperty = this.coproperties().find(item => item.id === copropertyId);
    if (coproperty) {
      this.activeCoproperty.setActiveCoproperty(coproperty);
    } else {
      this.activeCoproperty.setActive(copropertyId);
    }
    this.navigateToTargetDashboard();
  }

  addCoproperty(): void {
    this.router.navigate(['/coproperty/manage/new']);
  }

  editCoproperty(event: Event, copropertyId: string): void {
    event.stopPropagation();
    this.router.navigate(['/coproperty/manage', copropertyId, 'edit']);
  }

  onCardKeydown(event: KeyboardEvent, copropertyId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.selectAndEnter(copropertyId);
  }

  continueWithoutSelection(): void {
    this.navigateToTargetDashboard();
  }

  retry(): void {
    this.init();
  }

  private init(): void {
    this.loading.set(true);
    this.error.set(null);

    const requestedSpace = this.route.snapshot.queryParamMap.get('space');
    const effectiveSpace = this.resolveTargetSpace(requestedSpace);
    if (!effectiveSpace) {
      this.router.navigate(['/profile']);
      return;
    }

    this.targetSpace.set(effectiveSpace);
    if (effectiveSpace === 'owner') {
      this.loadOwnerCoproperties();
      return;
    }

    this.loadSyndicCoproperties();
  }

  private resolveTargetSpace(requested: string | null): TargetSpace | null {
    const roles = this.keycloakService.getUserRoles();
    const hasSyndic = roles.includes('coproperty-syndic') || roles.includes('coproperty-admin') || roles.includes('system-admin');
    const hasOwner = roles.includes('coproperty-owner') || roles.includes('coproperty-tenant');

    if (requested === 'owner' && hasOwner) return 'owner';
    if (requested === 'syndic' && hasSyndic) return 'syndic';
    if (hasSyndic) return 'syndic';
    if (hasOwner) return 'owner';
    return null;
  }

  private loadSyndicCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).pipe(
      take(1),
      catchError(() => {
        this.error.set('copropertySelection.loadError');
        this.loading.set(false);
        return of([] as SelectableCoproperty[]);
      })
    ).subscribe(coproperties => {
      this.handleLoadedCoproperties(coproperties);
    });
  }

  private loadOwnerCoproperties(): void {
    const userId = this.keycloakService.getUserId();
    if (!userId) {
      this.error.set('copropertySelection.userNotFound');
      this.loading.set(false);
      return;
    }

    forkJoin({
      owner: this.ownerService.getOwnerByUserId(userId).pipe(take(1), catchError(() => of(null))),
      units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
      coproperties: this.copropertyService.getCoproperties(undefined).pipe(take(1), catchError(() => of([] as Coproperty[])))
    }).pipe(
      map(({ owner, units, coproperties }) => {
        if (!owner) {
          this.router.navigate(['/register/complete-profile']);
          return [] as SelectableCoproperty[];
        }

        const unitCountByCoproperty = units.reduce((acc, unit) => {
          acc.set(unit.copropertyId, (acc.get(unit.copropertyId) ?? 0) + 1);
          return acc;
        }, new Map<string, number>());

        const accessibleIds = new Set(units.map(unit => unit.copropertyId));
        return coproperties
          .filter(coproperty => accessibleIds.has(coproperty.id))
          .map(coproperty => ({
            ...coproperty,
            ownedUnitsCount: unitCountByCoproperty.get(coproperty.id) ?? 0
          }));
      }),
      catchError(() => {
        this.error.set('copropertySelection.loadError');
        this.loading.set(false);
        return of([] as SelectableCoproperty[]);
      })
    ).subscribe(coproperties => {
      this.handleLoadedCoproperties(coproperties);
    });
  }

  private handleLoadedCoproperties(coproperties: SelectableCoproperty[]): void {
    const managementRequested = this.route.snapshot.queryParamMap.get('manage') === 'true';
    if (coproperties.length === 1 && !managementRequested) {
      this.activeCoproperty.setActiveCoproperty(coproperties[0]);
      this.navigateToTargetDashboard();
      return;
    }

    this.coproperties.set(coproperties);
    this.loading.set(false);
  }

  private navigateToTargetDashboard(): void {
    const path = this.targetSpace() === 'owner'
      ? ['/coproperty/owner/dashboard']
      : ['/coproperty/syndic/dashboard'];
    this.router.navigate(path);
  }
}
