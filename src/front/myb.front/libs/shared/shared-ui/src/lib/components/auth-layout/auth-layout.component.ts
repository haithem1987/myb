import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css'],
})
export class AuthLayoutComponent {
  /** Current step number in multi-step flows (1-based). 0 or null = no stepper shown. */
  @Input() currentStep: number | null = null;

  /** Total number of steps. Must be set if currentStep is set. */
  @Input() totalSteps: number | null = null;

  /** Labels for each step (optional, falls back to i18n). */
  @Input() stepLabels: string[] = [];

  /** Returns an array from 1..totalSteps for template iteration. */
  get stepIndices(): number[] {
    if (!this.totalSteps) return [];
    return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
  }
}
