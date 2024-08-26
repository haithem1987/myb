import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-loading-indicator',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: ` <div *ngIf="isLoading" class="text-center">
    <p>{{ 'LOADING' | translate }}</p>
  </div>`,
  styleUrl: './loading-indicator.component.css',
})
export class LoadingIndicatorComponent {
  @Input() isLoading = false;
}
