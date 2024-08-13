import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-timesheet-action-buttons',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './timesheet-action-buttons.component.html',
  styleUrl: './timesheet-action-buttons.component.css',
})
export class TimesheetActionButtonsComponent {
  @Input() selectedProjectsSize = 0;
  @Input() isSaving = false;
  @Output() fillProjects = new EventEmitter<void>();
  @Output() extractPDF = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();

  fillSelectedProjects() {
    this.fillProjects.emit();
  }

  extractPdf() {
    this.extractPDF.emit();
  }

  saveAllChanges() {
    this.saveChanges.emit();
  }
}
