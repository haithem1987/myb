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
      id: 2,
      name: 'DOCUMENT_MANAGEMENT',
      icon: 'evaluation.png',
      description: 'DOCUMENT_MANAGEMENT_DESC',
      route: '/documents',
      price: 20,
      currency: 'USD',
    },
    {
      id: 1,
      name: 'TIMESHEET_MANAGEMENT',
      icon: 'calendar.png',
      description: 'TIMESHEET_DESC',
      route: '/timesheet',
      price: 15,
      currency: 'USD',
    },
    {
      id: 3,
      name: 'INVOICE_MANAGEMENT',
      icon: 'finance.png',
      description: 'INVOICE_MANAGEMENT_DESC',
      route: '/invoice',
      price: 30,
      currency: 'USD',
    },
    {
      id: 4,
      name: 'COPROPERTY_MANAGEMENT',
      icon: 'building.png',
      description: 'COPROPERTY_MANAGEMENT_DESC',
      route: '/coproperty',
      price: 25,
      currency: 'USD',
    },
  ];
}

