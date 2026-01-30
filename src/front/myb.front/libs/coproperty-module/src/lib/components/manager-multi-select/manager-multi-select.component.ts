import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ManagerOption {
  value: string;
  label: string;
  isNew?: boolean;
}

@Component({
  selector: 'myb-manager-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-multi-select.component.html',
  styleUrls: ['./manager-multi-select.component.scss']
})
export class ManagerMultiSelectComponent implements OnInit, OnChanges {
  @Input() selectedManager: string | null = null;
  @Output() managerSelected = new EventEmitter<{ name: string }>();

  searchTerm = signal<string>('');
  isDropdownOpen = signal<boolean>(false);
  selectedManagerName = signal<string>('');
  isManagerUsed = signal<boolean>(false);

  // Mock data - in production, this would come from a service
  availableManagers = signal<ManagerOption[]>([
    { value: 'Jean Dupont', label: 'Jean Dupont' },
    { value: 'Marie Martin', label: 'Marie Martin' },
    { value: 'Pierre Durand', label: 'Pierre Durand' },
    { value: 'Sophie Bernard', label: 'Sophie Bernard' },
    { value: 'Thomas Petit', label: 'Thomas Petit' }
  ]);

  filteredManagers = signal<ManagerOption[]>([]);

  ngOnInit() {
    this.updateSelection();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedManager']) {
      this.updateSelection();
    }
  }

  private updateSelection() {
    if (this.selectedManager && this.selectedManager.trim()) {
      this.selectedManagerName.set(this.selectedManager);
      this.isManagerUsed.set(true);
    } else {
      this.selectedManagerName.set('');
      this.isManagerUsed.set(false);
    }
    this.filteredManagers.set(this.availableManagers());
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const term = input.value;
    this.searchTerm.set(term);
    this.filterManagers(term);
    this.isDropdownOpen.set(true);
  }

  filterManagers(term: string) {
    if (!term.trim()) {
      this.filteredManagers.set(this.availableManagers());
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = this.availableManagers().filter(m =>
      m.label.toLowerCase().includes(lowerTerm)
    );

    // Check if we should show "Add new" option
    const exactMatch = filtered.some(m => m.label.toLowerCase() === lowerTerm);
    
    if (!exactMatch && term.trim()) {
      // Format the name before showing
      const formattedName = this.formatName(term);
      this.filteredManagers.set([
        { value: formattedName, label: `+ Add "${formattedName}"`, isNew: true },
        ...filtered
      ]);
    } else {
      this.filteredManagers.set(filtered);
    }
  }

  formatName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  selectManager(manager: ManagerOption) {
    const managerName = manager.isNew ? manager.value : manager.label;
    this.selectedManagerName.set(managerName);
    this.searchTerm.set('');
    this.isDropdownOpen.set(false);
    
    // If it's a new manager, add it to the available list
    if (manager.isNew) {
      this.availableManagers.update(managers => [
        ...managers,
        { value: managerName, label: managerName }
      ]);
    }
    
    // Automatically emit the selection to update the form
    this.managerSelected.emit({ name: managerName });
    this.isManagerUsed.set(true);
  }

  applySelection() {
    if (!this.selectedManagerName()) {
      return;
    }

    this.isManagerUsed.set(true);
    this.managerSelected.emit({ name: this.selectedManagerName() });
  }

  clearSelection() {
    this.selectedManagerName.set('');
    this.searchTerm.set('');
    this.isManagerUsed.set(false);
    this.isDropdownOpen.set(false);
    this.managerSelected.emit({ name: '' });
  }

  toggleDropdown() {
    this.isDropdownOpen.update(open => !open);
    if (this.isDropdownOpen()) {
      this.filteredManagers.set(this.availableManagers());
    }
  }

  onFocus() {
    this.isDropdownOpen.set(true);
    this.filteredManagers.set(this.availableManagers());
  }

  onBlur() {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      this.isDropdownOpen.set(false);
    }, 200);
  }
}
