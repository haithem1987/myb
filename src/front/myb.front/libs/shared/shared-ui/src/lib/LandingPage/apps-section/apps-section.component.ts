import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
      route: '/timesheet',
    },
    {
      id: 2,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
      route: '/documents',
    },
    {
      id: 3,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
      route: '/documents',
    },
    {
      id: 4,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
      route: '/documents',
    },
    {
      id: 5,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
      route: '/documents',
    },
    {
      id: 6,
      name: 'Document Management',
      icon: 'timesheet.png',
      description: 'Organize and store your documents securely.',
      route: '/documents',
    },
    // Add more modules as needed
  ];

  constructor(private router: Router) {}

  navigateToApp(route: string): void {
    this.router.navigate([route]);
  }
}
