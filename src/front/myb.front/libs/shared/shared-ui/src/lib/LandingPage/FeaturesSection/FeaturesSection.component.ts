import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterService } from './CounterService';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'myb-front-features-section',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './FeaturesSection.component.html',
  styleUrl: './FeaturesSection.component.css',
})
export class FeaturesSectionComponent {
  constructor(public counterService: CounterService) {}
  incrementCount() {
    this.counterService.increment();
  }
}
