import { Component, TemplateRef } from '@angular/core';
import { ToastService } from '../../../../../infra/services/toast.service';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts-container',
  templateUrl: './toasts-container.component.html',
  standalone: true,
  imports: [CommonModule, NgbToastModule],
  host: { '[class.ngb-toasts]': 'true' },
  styleUrls: ['./toasts-container.component.css'],
})
export class ToastsContainerComponent {
  constructor(public toastService: ToastService) {}
  isTemplate(toast: any) {
    return toast.textOrTpl instanceof TemplateRef;
  }
}
