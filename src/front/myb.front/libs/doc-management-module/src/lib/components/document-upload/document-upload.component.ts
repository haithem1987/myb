import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '../../models/DocumentModel';
import { DocumentStatus } from '../../models/DocumentStatus';
import { DocumentService } from '../../services/Document.service';

@Component({
  selector: 'myb-front-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css',
})
export class DocumentUploadComponent {

  selectedFile: File | null = null;
  documents: DocumentModel[] = [];

  newDocument: DocumentModel = {
    id: 0,
    documentName: '',
    createdBy: 0,
    editedBy: 0,
    documentType: undefined,
    status: DocumentStatus.Approved,
    documentSize: 0,
    folderId: null,
    folder: null,
    versions: null,
    createdDate: new Date(),
    LastModifiedDate: new Date()
  };

  constructor(private documentService: DocumentService) {}

  onCreateDocument(): void {
    if (!this.selectedFile) {
      console.error('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('documentName', this.newDocument.documentName);
    formData.append('createdBy', this.newDocument.createdBy.toString());
    formData.append('documentSize', this.newDocument.documentSize.toString());
    formData.append('folderId', this.newDocument.folderId?.toString() || '');
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.documentService.create(this.newDocument).subscribe(
      (createdDocument) => {
        console.log('Document created successfully:', createdDocument);
        this.resetForm();
      },
      (error) => {
        console.error('Error creating document:', error);
      }
    );
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  resetForm(): void {
    this.selectedFile = null;
    this.newDocument = {
      id: 0,
      documentName: '',
      createdBy: 0,
      editedBy: 0,
      documentType: undefined,
      status: DocumentStatus.Approved,
      documentSize: 0,
      folderId: null,
      folder: null,
      versions: null,
      createdDate: new Date(),
      LastModifiedDate: new Date()
    };
  }

  openFileSelector(event: any): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.accept = '*/*';

    input.addEventListener('change', (event: any) => {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        this.onCreateDocument();
      }
    });

    input.click();
  }
  //alldoc
  loadDocuments() {
    this.documentService.getAll().subscribe((data: any) => {
      console.log("Received data from server:", data);
     // console.log('status ',this.documents);
      
      if (data && data.allDocuments && Array.isArray(data.allDocuments)) {
        this.documents = data.allDocuments;
      } else {
        console.error("Invalid data format received from the server");
      }
    });
  }
//   addDocument():void{
//    const newDocument: DocumentModel = {
//       id: 0,
//       documentName: '',
//       createdBy: 0,
//       editedBy: 0,
//       documentType: undefined,
//       status: DocumentStatus.Approved,
//       documentSize: 0,
//       folderId: null,
//       folder: null,
//       versions: null,
//       createdDate: new Date(),
//       LastModifiedDate: new Date()
//     };
//     this.documentService.create(newDocument).subscribe(() => {
//       this.loadDocuments();
//       console.log('add doc' ,this.loadDocuments);
//     });

//   }
}