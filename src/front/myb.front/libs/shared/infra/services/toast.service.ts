import { Injectable, TemplateRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts: any[] = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ ...options, textOrTpl });
  }

  showSuccess(message: string) {
    this.show(message, { classname: 'bg-success text-white' });
  }

  showError(message: string) {
    this.show(message, { classname: 'bg-danger text-white' });
  }

  showInfo(message: string) {
    this.show(message, { classname: 'bg-info text-dark' });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
}
