import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../components/card/card.component';

interface App {
  id: number;
  name: string;
  icon: string;
  description: string;
  route: string;
}

@Component({
  selector: 'myb-front-apps-section',
  standalone: true,
  imports: [CommonModule, CardComponent, TranslateModule],
  templateUrl: './apps-section.component.html',
  styleUrls: ['./apps-section.component.css'],
})
export class AppsSectionComponent {
  list: App[] = [
    {
      id: 1,
      name: 'TIMESHEET',
      icon: 'timesheet.png',
      description: 'TIMESHEET_DESC',
      route: '/timesheet',
    },
    {
      id: 2,
      name: 'DOCUMENT_MANAGEMENT',
      icon: 'timesheet.png',
      description: 'DOCUMENT_MANAGEMENT_DESC',
      route: '/documents',
    },
    {
      id: 3,
      name: 'INVOICE_MANAGEMENT',
      icon: 'bills.png',
      description: 'INVOICE_MANAGEMENT_DESC',
      route: '/invoice',
    },
    // Add more modules as needed
  ];

  constructor(private router: Router) {}

  navigateToApp(route: string): void {
    this.router.navigate([route]);
  }
}
