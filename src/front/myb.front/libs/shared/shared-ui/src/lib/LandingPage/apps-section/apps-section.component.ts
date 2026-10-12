import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface App {
  id: number;
  name: string;
  icon: string;
  description: string;
  route: string;
  price: number;
  currency: string;
}

@Component({
  selector: 'myb-front-apps-section',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './apps-section.component.html',
  styleUrls: ['./apps-section.component.css'],
})
export class AppsSectionComponent {
  list: App[] = [
    {
      id: 4,
      name: 'COPROPERTY_MANAGEMENT',
      icon: 'building.png',
      description: 'COPROPERTY_MANAGEMENT_DESC',
      route: '/coproperty/select?space=syndic',
      price: 25,
      currency: 'USD',
    },
  ];
}
