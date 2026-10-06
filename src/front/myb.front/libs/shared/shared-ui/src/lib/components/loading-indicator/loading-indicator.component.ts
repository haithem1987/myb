import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-loading-indicator',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: ` <div *ngIf="isLoading" class="loading-state" role="status" aria-live="polite">
    <span class="spinner-border text-primary" aria-hidden="true"></span>
    <p>{{ message || ('LOADING' | translate) }}</p>
  </div>`,
  styleUrl: './loading-indicator.component.css',
})
export class LoadingIndicatorComponent {
  @Input() isLoading = false;
  @Input() message = '';
}
