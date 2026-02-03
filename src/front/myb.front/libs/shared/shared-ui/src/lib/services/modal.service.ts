import { Injectable, inject } from '@angular/core';
import { signal } from '@angular/core';

export interface ModalConfig {
  title: string;
  message?: string;
  content?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface Modal {
  id: string;
  config: ModalConfig;
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modals = signal<Modal[]>([]);
  private modalIdCounter = 0;

  /**
   * Open a confirmation dialog
   */
  confirm(config: ModalConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const modalId = `modal-${++this.modalIdCounter}`;
      const modal: Modal = {
        id: modalId,
        config: {
          ...config,
          showCancelButton: config.showCancelButton ?? true,
          confirmButtonText: config.confirmButtonText ?? 'Confirmer',
          cancelButtonText: config.cancelButtonText ?? 'Annuler',
          confirmButtonClass: config.confirmButtonClass ?? 'btn-primary',
          size: config.size ?? 'md',
          onConfirm: async () => {
            if (config.onConfirm) {
              await config.onConfirm();
            }
            this.close(modalId);
            resolve(true);
          },
          onCancel: () => {
            if (config.onCancel) {
              config.onCancel();
            }
            this.close(modalId);
            resolve(false);
          }
        },
        isOpen: true
      };

      this.modals.update(modals => [...modals, modal]);
    });
  }

  /**
   * Open an alert dialog (no cancel button)
   */
  alert(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      this.confirm({
        title,
        message,
        showCancelButton: false,
        confirmButtonText: 'OK',
        onConfirm: () => resolve()
      });
    });
  }

  /**
   * Open a custom content modal
   */
  open(config: ModalConfig): string {
    const modalId = `modal-${++this.modalIdCounter}`;
    const modal: Modal = {
      id: modalId,
      config: {
        ...config,
        size: config.size ?? 'md',
        showCancelButton: config.showCancelButton ?? true,
        confirmButtonText: config.confirmButtonText ?? 'OK',
        cancelButtonText: config.cancelButtonText ?? 'Fermer'
      },
      isOpen: true
    };

    this.modals.update(modals => [...modals, modal]);
    return modalId;
  }

  /**
   * Close a specific modal
   */
  close(modalId: string): void {
    this.modals.update(modals => 
      modals.filter(m => m.id !== modalId)
    );
  }

  /**
   * Close all modals
   */
  closeAll(): void {
    this.modals.set([]);
  }

  /**
   * Get all open modals
   */
  getModals() {
    return this.modals;
  }
}
