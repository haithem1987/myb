import { DocumentService } from './../../services/Document.service';
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentModel } from '../../models/DocumentModel';

@Component({
  selector: 'myb-front-document-edit',
  standalone: true,
  imports: [CommonModule,NgbModalModule],
  templateUrl: './document-edit.component.html',
  styleUrl: './document-edit.component.css',
})
export class DocumentEditComponent {

documents: DocumentModel[]=[];
activeModal = inject(NgbActiveModal);
documentType: any;

  // constructor(DocumentService:DocumentService) {}
  document: DocumentModel | any;



  
}
