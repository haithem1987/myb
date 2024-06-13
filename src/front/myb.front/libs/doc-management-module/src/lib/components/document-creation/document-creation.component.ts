import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DocumentService } from './../../services/Document.service';
import { FolderService } from '../../services/folder.service';
import { DocumentModel } from '../../models/DocumentModel';
import { Folder } from '../../models/Folder';
import { DocumentType } from '../../models/DocumentType';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import { Router } from '@angular/router';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-document-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentUploadComponent],
  templateUrl: './document-creation.component.html',
  styleUrls: ['./document-creation.component.css'],
})
export class DocumentCreationComponent implements OnInit {
  documentName: string = '';
  folderId: number | null = null;
  documentType: DocumentType | undefined = undefined;

  @Output() documentCreated = new EventEmitter<DocumentModel>();
  folders: Folder[] = [];
  documents: DocumentModel[] = [];
  documentTypes = Object.values(DocumentType).filter(value => typeof value === 'string') as string[];
  @ViewChild(DocumentUploadComponent) documentUploadComponent: DocumentUploadComponent | undefined;

  constructor(
    public activeModal: NgbActiveModal,
    private documentService: DocumentService,
    private folderService: FolderService,
    private router: Router,
    private  toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders() {
    this.folderService.getAll().subscribe(
      (data: Folder[]) => {
        this.folders = data;
      },
      (error) => {
        console.error('Error loading folders', error);
      }
    );
  }
  // calculateFolderSizes() {
  //   this.folders.forEach(folder => {
  //     folder.size = this.documents
  //       .filter(doc => doc.folderId === folder.id)
  //       .reduce((total, doc) => total + (doc.documentSize || 0), 0);
  //   });
  // }

  createDocument(): void {
    if (this.documentType !== undefined && this.folderId !== null) {
      const selectedFiles = this.documentUploadComponent?.selectedFiles || [];
      if (selectedFiles.length > 0) {
        const document = {
          id:0,
          documentName: selectedFiles[0].ImageName,
          documentType: this.documentType.toString(),
          // documentType :selectedFiles[0].file.type,
          createdBy: 1,
          editedBy: 1,
          folderId: parseInt(this.folderId.toString()),
          documentSize: selectedFiles[0].file.size,
          file: selectedFiles[0].Image, // Save the base64 string
          url: selectedFiles[0].url, // 
          createdAt: new Date(),
          updatedAt: new Date(),
         
        };
        console.log('url:', selectedFiles[0].url);
        
        // console.log('file:', selectedFiles[0].Image);
        this.documentService.createDocument(document).subscribe(
          (newDocument) => {
            this.documents.push(newDocument);
            this.documentCreated.emit(newDocument);
            this.toastService.show('Document Added successfully!', {
              classname: 'bg-success text-light text-center ',
            });

            this.activeModal.close();


    console.log('new doc', newDocument);
  },
          (error) => {
            console.error('Error creating document:', error);
            
            this.toastService.show('An error occurred while creating the document. Please try again.', {
              classname: 'bg-danger text-light',
            });
          }
        );
      } else{
        this.toastService.show('Please upload a file', {
          classname: 'bg-warning text-dark',
        });
      }
    } else {
      this.toastService.show('Please enter all required fields', {
        classname: 'bg-warning text-dark',
      });
    }
  }

 

}
