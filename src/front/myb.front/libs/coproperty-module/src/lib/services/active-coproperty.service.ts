import { Injectable, signal } from '@angular/core';

export interface SelectableCoproperty {
  id: string;
  isActive?: boolean;
  name?: string;
  currency?: string;
}

const STORAGE_KEY = 'activeCopropertyId';
const SNAPSHOT_STORAGE_KEY = 'activeCopropertySnapshot';

/** Keeps the user's coproperty context stable while navigating between menus. */
@Injectable({ providedIn: 'root' })
export class ActiveCopropertyService {
  private readonly selectedId = signal(this.readStoredId());
  private readonly selectedCoproperty = signal<SelectableCoproperty | null>(this.readStoredSnapshot());
  readonly activeId = this.selectedId.asReadonly();
  readonly activeCoproperty = this.selectedCoproperty.asReadonly();

  selectAvailable<T extends SelectableCoproperty>(
    coproperties: readonly T[],
    requestedId?: string | null
  ): string {
    const candidates = [requestedId, this.selectedId(), this.readStoredId()];
    const selected = candidates.find(id => !!id && coproperties.some(c => c.id === id));
    const fallback = coproperties.find(c => c.isActive !== false) ?? coproperties[0];
    const id = selected || fallback?.id || '';
    const coproperty = coproperties.find(item => item.id === id);
    if (coproperty) this.setActiveCoproperty(coproperty);
    return id;
  }

  setActive(copropertyId: string | null | undefined): void {
    if (!copropertyId) return;
    const isDifferentCoproperty = this.selectedCoproperty()?.id !== copropertyId;
    this.selectedId.set(copropertyId);
    if (isDifferentCoproperty) {
      this.selectedCoproperty.set({ id: copropertyId });
    }
    try {
      localStorage.setItem(STORAGE_KEY, copropertyId);
      if (isDifferentCoproperty) {
        localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
      }
    } catch {
      // Storage can be unavailable in private/locked-down browser contexts.
    }
  }

  setActiveCoproperty(coproperty: SelectableCoproperty): void {
    this.selectedId.set(coproperty.id);
    this.selectedCoproperty.set({ ...coproperty });
    try {
      localStorage.setItem(STORAGE_KEY, coproperty.id);
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(coproperty));
    } catch {
      // Storage can be unavailable in private/locked-down browser contexts.
    }
  }

  private readStoredId(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private readStoredSnapshot(): SelectableCoproperty | null {
    try {
      const value = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (!value) return null;
      const parsed = JSON.parse(value) as SelectableCoproperty;
      return parsed?.id ? parsed : null;
    } catch {
      return null;
    }
  }
}
