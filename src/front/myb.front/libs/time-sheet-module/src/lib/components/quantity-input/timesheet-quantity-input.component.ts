import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ApprovalStatus } from '../../models/timesheet.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-timesheet-quantity-input',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './timesheet-quantity-input.component.html',
  styleUrl: './timesheet-quantity-input.component.css',
})
export class TimesheetQuantityInputComponent {
  @Input() projectId!: number;
  @Input() date!: { dateString: string; weekday: string; day: string };
  @Input() quantity: number = 0;
  @Input() isHoliday: boolean = false;
  @Input() editable: boolean = true;
  @Input() status: ApprovalStatus = ApprovalStatus.PENDING;
  @Output() quantityChange = new EventEmitter<number>();

  onQuantityChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newQuantity = Number(inputElement.value);
    this.quantityChange.emit(newQuantity);
  }
}
