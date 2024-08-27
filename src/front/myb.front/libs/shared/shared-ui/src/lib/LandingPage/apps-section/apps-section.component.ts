import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../components/card/card.component';
import { AuthConfirmationModalComponent } from '../../components/auth-confirmation-modal/auth-confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

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
      id: 2,
      name: 'DOCUMENT_MANAGEMENT',
      icon: 'evaluation.png',
      description: 'DOCUMENT_MANAGEMENT_DESC',
      route: '/documents',
    },
    {
      id: 1,
      name: 'TIMESHEET_MANAGEMENT',
      icon: 'calendar.png',
      description: 'TIMESHEET_DESC',
      route: '/timesheet',
    },
    {
      id: 3,
      name: 'INVOICE_MANAGEMENT',
      icon: 'finance.png',
      description: 'INVOICE_MANAGEMENT_DESC',
      route: '/invoice',
    },
    // Add more modules as needed
  ];

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private keycloakService: KeycloakService
  ) {}

  navigateToApp(route: string): void {
    if (this.keycloakService.isAuthenticated()) {
      this.router.navigate([route]);
    } else {
      const modalRef = this.modalService.open(AuthConfirmationModalComponent);
      modalRef.componentInstance.confirmEvent.subscribe(
        (confirmed: boolean) => {
          if (confirmed) {
            this.router.navigate([route]);
          }
        }
      );
    }
  }
}
