import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.css'],
  host: {
    '[class.modals-open]': 'isModalsOpen()'
  }
})
export class ModalContainerComponent {
  constructor(public modalService: ModalService) {}

  isModalsOpen(): boolean {
    return this.modalService.getModals()().length > 0;
  }

  handleConfirm(modal: any): void {
    if (modal.config.onConfirm) {
      const result = modal.config.onConfirm();
      if (result instanceof Promise) {
        result.catch((err) => console.error('Error in onConfirm:', err));
      }
    }
  }

  handleCancel(modal: any): void {
    if (modal.config.onCancel) {
      try {
        modal.config.onCancel();
      } catch (err) {
        console.error('Error in onCancel:', err);
      }
    }
  }
}
