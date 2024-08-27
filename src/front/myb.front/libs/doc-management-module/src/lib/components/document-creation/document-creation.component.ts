import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DocumentService } from './../../services/Document.service';
import { FolderService } from '../../services/folder.service';
import { DocumentModel } from '../../models/DocumentModel';
import { Folder } from '../../models/Folder';
import { DocumentType } from '../../models/DocumentType';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';

import { ToastService } from 'libs/shared/infra/services/toast.service';
import { KeycloakProfile } from 'keycloak-js';
import { Observable } from 'rxjs';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

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
  documentTypes = Object.values(DocumentType).filter(
    (value) => typeof value === 'string'
  ) as string[];
  @ViewChild(DocumentUploadComponent) documentUploadComponent:
    | DocumentUploadComponent
    | undefined;
  user$: Observable<KeycloakProfile | null>;

  constructor(
    public activeModal: NgbActiveModal,
    private documentService: DocumentService,
    private folderService: FolderService,
    private toastService: ToastService,
    private keycloakService: KeycloakService
  ) {
    this.user$ = this.keycloakService.profile$;
  }

  ngOnInit(): void {
    // this.loadFolders();
  }

  createDocument(): void {
    if (this.folderId !== null) {
      const selectedFiles = this.documentUploadComponent?.selectedFiles || [];
      if (selectedFiles.length > 0) {
        this.user$.subscribe({
          next: (userProfile) => {
            if (userProfile) {
              const document = {
                id: 0,
                documentName: selectedFiles[0].ImageName,
                documentType: this.getDocumentType(selectedFiles[0].fileType),
                createdBy: userProfile.username || 'Unknown User',
                editedBy: userProfile.username || 'Unknown User',
                folderId: parseInt(this.folderId?.toString() || '0'),
                documentSize: selectedFiles[0].file.size,
                file: selectedFiles[0].Image,
                url: selectedFiles[0].url,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              this.documentService.create(document).subscribe(
                (newDocument) => {
                  this.documents.push(newDocument);
                  this.documentCreated.emit(newDocument);
                  this.toastService.show('Document Added successfully!', {
                    classname: 'bg-success text-light text-center ',
                  });
                  this.activeModal.close();
                },
                (error) => {
                  console.error('Error creating document:', error);
                  this.toastService.show(
                    'An error occurred while creating the document. Please try again.',
                    {
                      classname: 'bg-danger text-light',
                    }
                  );
                }
              );
            } else {
              this.toastService.show('Unable to retrieve user information.', {
                classname: 'bg-warning text-dark',
              });
            }
          },
          error: (error) => {
            console.error('Error fetching user profile:', error);
          },
        });
      } else {
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

  private getDocumentType(fileType: string | undefined): string {
    switch (fileType) {
      case 'application/pdf':
        return DocumentType.PDF;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return DocumentType.Word;

      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return DocumentType.Excel;

      case 'image/jpeg':
      case 'image/png':
        return DocumentType.Image;

      default:
        return 'UNKNOWN';
    }
  }
}
