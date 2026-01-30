import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-manager-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-select.component.html',
  styleUrls: ['./manager-select.component.scss']
})
export class ManagerSelectComponent {
  @Input() selectedName: string | null = null;
  @Output() managerSelected = new EventEmitter<{ name?: string }>();

  tempName: string = '';
  isManagerUsed: boolean = false;

  ngOnInit() {
    this.tempName = this.selectedName ?? '';
    this.isManagerUsed = !!this.selectedName;
  }

  isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  applySelection() {
    const payload: { name?: string } = {};
    let name = this.tempName.trim();

    // Format manager name: capitalize first letter of each word
    if (name) {
      name = name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      payload.name = name;
      this.tempName = name; // Update the input field with formatted name
    }

    this.isManagerUsed = true;
    this.managerSelected.emit(payload);
  }

  clearSelection() {
    this.tempName = '';
    this.isManagerUsed = false;
    this.managerSelected.emit({ name: '' });
  }
}
