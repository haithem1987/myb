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

  createDocument(): void {
    if (this.documentName && this.documentType !== undefined && this.folderId !== null) {
      const selectedFiles = this.documentUploadComponent?.selectedFiles || [];
      if (selectedFiles.length > 0) {
        const document = {
          id: 0,
          documentName: this.documentName,
          documentType: this.documentType.toString(),
          createdBy: 1,
          editedBy: 1,
          folderId: parseInt(this.folderId.toString()),
          documentSize: selectedFiles[0].file.size,
          file: selectedFiles[0].Image, // Save the base64 string
          url: selectedFiles[0].url, // Save the URL
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('url:', selectedFiles[0].url);
        console.log('file:', selectedFiles[0].Image);
        this.documentService.createDocument(document).subscribe(
          (newDocument) => {
            this.documents.push(newDocument);
            this.documentCreated.emit(newDocument);
            this.activeModal.close();
            console.log('new doc', newDocument);
          },
          (error) => {
            console.error('Error creating document:', error);
            alert('An error occurred while creating the document. Please try again.');
          }
        );
      } else {
        alert('Please upload a file');
      }
    } else {
      alert('Please enter all required fields');
    }
  }

  

}
