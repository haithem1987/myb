import { DocumentStatus } from './../models/DocumentStatus';
import { DocumentsListComponent } from './../components/documents-list/documents-list.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../services/Document.service';
import { DocumentModel } from '../models/DocumentModel';
import { DocumentType } from '../models/DocumentType';
import { NavLinksComponent } from '../components/nav-links/nav-links.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentEditComponent } from '../components/document-edit/document-edit.component';
import { Observable } from 'rxjs';
import { DocumentUploadComponent } from '../components/document-upload/document-upload.component';
import { FolderCardsComponent } from '../components/Folders/folder-cards/folder-cards.component';

@Component({
  selector: 'myb-front-doc-management-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule , 
    NavLinksComponent , 
    DocumentEditComponent ,
    DocumentUploadComponent,
    FolderCardsComponent,
    DocumentsListComponent

  ],
  templateUrl: './doc-management-module.component.html',
  styleUrl: './doc-management-module.component.css',
})
export class DocManagementModuleComponent implements OnInit {

documents :DocumentModel[] = [];
selectedDocument :DocumentModel|any ;
status :DocumentStatus | undefined;

newDocument: DocumentModel = {
  id:0,
  documentName: '', 
  createdBy: 0, 
  editedBy: 0, 
  documentType: DocumentType.Word,  
  status:DocumentStatus.Approved,
  documentSize: 0, 
  folderId: null, 
  folder: null, 
  versions: null,
  createdDate: new Date(), 
  LastModifiedDate: new Date() 
}; 
documentTypes = Object.values(DocumentType);

  constructor( private DocumentService: DocumentService , private modalService: NgbModal  ){}


  
  ngOnInit(){
    this.loadDocuments();
  }

 
  //alldoc
  loadDocuments() {
    this.DocumentService.getAll().subscribe((data: any) => {
      console.log("Received data from server:", data);
     console.log('status ',data.status);
      
      if (data && data.allDocuments && Array.isArray(data.allDocuments)) {
        this.documents = data.allDocuments;
      } else {
        console.error("Invalid data format received from the server");
      }
    });
  }
  

//delete doc
deleteDocument(docId: number){
  this.DocumentService.delete(docId).subscribe(() => {
    this.loadDocuments();
    // this.documents = this.documents.filter(doc => doc.id !== docId);

  });

}

//select doc
selectDocument(document: DocumentModel): void {
  this.selectedDocument = { ...document };
  console.log( "select doc ",this.selectedDocument);
}

cancel(): void {
  this.selectedDocument = null;
}


//modal 
	openModal(document?: DocumentModel) {
		const modalRef = this.modalService.open(DocumentEditComponent);
    modalRef.componentInstance.documents = this.documents;
    console.log('modal',modalRef.componentInstance.documents)
	}

//update doc 
updatedocument():void {
  if (this.selectedDocument) {
    this.DocumentService.update(this.selectedDocument.id, this.selectedDocument).subscribe(
      () => {
        this.loadDocuments();
        this.cancel();
        console.log('update ', this.selectedDocument);
      },
      (error) => {
        console.error('Error updating document:', error);
      }
    );
  }

}
getStatusClass(status: DocumentStatus): string {
 // console.log('stattus ',status);

  switch (status) {
    case DocumentStatus.Submitted:
      return 'status-submitted';
    case DocumentStatus.Approved:
      return 'status-approved';
    case DocumentStatus.Rejected:
      return 'status-rejected';
    default:
      return '';
  }
  
}
 

}
