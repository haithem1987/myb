import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-hero-section',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './HeroSection.component.html',
  styleUrl: './HeroSection.component.css',
})
export class HeroSectionComponent {
  
}
