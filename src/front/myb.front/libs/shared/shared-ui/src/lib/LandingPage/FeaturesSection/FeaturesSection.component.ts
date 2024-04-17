import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterService } from './CounterService';
@Component({
  selector: 'myb-front-features-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './FeaturesSection.component.html',
  styleUrl: './FeaturesSection.component.css',
})
export class FeaturesSectionComponent {
  constructor(public counterService: CounterService) {}
  incrementCount() {
    this.counterService.increment();
  }
}
