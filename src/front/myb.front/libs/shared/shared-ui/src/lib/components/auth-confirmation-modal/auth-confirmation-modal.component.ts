import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-auth-confirmation-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './auth-confirmation-modal.component.html',
  styleUrl: './auth-confirmation-modal.component.css',
})
export class AuthConfirmationModalComponent {
  @Output() confirmEvent = new EventEmitter<boolean>();

  constructor(
    public activeModal: NgbActiveModal,
    private keycloakService: KeycloakService
  ) {}

  login(): void {
    this.keycloakService.init().then(() => {
      this.keycloakService.login();
      this.activeModal.close();
    });
  }

  register(): void {
    this.keycloakService.register();
    this.activeModal.close();
  }

  declineAccess(): void {
    this.confirmEvent.emit(false);
    this.activeModal.close(false);
  }
}
