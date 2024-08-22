import { DocumentService } from './../../services/Document.service';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentModel } from '../../models/DocumentModel';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-document-edit',
  standalone: true,
  imports: [CommonModule,NgbModalModule,FormsModule],
  templateUrl: './document-edit.component.html',
  styleUrl: './document-edit.component.css',
})
export class DocumentEditComponent {
  @Input() document: DocumentModel | any = {};
  @Output() documentUpdated = new EventEmitter<DocumentModel>();

  constructor(
    public activeModal: NgbActiveModal,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    if (!this.document) {
      this.document = {};  
    }
    console.log('DocumentEditComponent initialized', this.document);
  }

  saveDocument(): void {
    if (this.document) {
      const updatedDocument = { ...this.document, updatedAt: new Date() };

      this.documentService.update(this.document.id,updatedDocument).subscribe(
        (updatedDoc) => {
          this.documentUpdated.emit(updatedDoc);
          this.activeModal.close();
        },
        (error) => {
          console.error('Error updating document:', error);
        }
      );
    }
  }
}
