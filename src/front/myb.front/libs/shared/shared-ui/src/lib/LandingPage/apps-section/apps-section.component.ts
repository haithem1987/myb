import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface App {
  id: number;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'myb-front-apps-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './apps-section.component.html',
  styleUrls: ['./apps-section.component.css'],
})
export class AppsSectionComponent {
  list: App[] = [
    {
      id: 1,
      name: 'Timesheet',
      icon: 'bills.png',
      description: 'Manage your working hours and projects.',
    },
    {
      id: 2,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
    },
    {
      id: 3,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
    },
    {
      id: 4,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
    },
    {
      id: 5,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
    },
    {
      id: 6,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
    },
    // Add more modules as needed
  ];

  navigateToApp(appId: number): void {
    console.log('appId', appId);
  }
}
