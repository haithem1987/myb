import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-period-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './period-selector.component.html',
  styleUrl: './period-selector.component.css',
})
export class PeriodSelectorComponent {
  @Input() selectedPeriod: 'week' | 'month' = 'week';
  @Input() weekQuantity = 0;
  @Input() monthQuantity = 0;
  @Output() periodChange = new EventEmitter<'week' | 'month'>();

  selectPeriod(period: 'week' | 'month') {
    this.periodChange.emit(period);
  }
}
