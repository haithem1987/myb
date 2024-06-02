import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DocumentService } from './../../services/Document.service';
import { FolderService } from '../../services/folder.service';
import { DocumentModel } from '../../models/DocumentModel';
import { Folder } from '../../models/Folder';
import { DocumentType } from '../../models/DocumentType';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'myb-front-document-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-creation.component.html',
  styleUrls: ['./document-creation.component.css'],
})
export class DocumentCreationComponent implements OnInit {
  documentName: string = '';
  folderId: number | null = null;
  documentType: DocumentType | undefined = undefined;
  // content: string = '';
  @Output() documentCreated = new EventEmitter<DocumentModel>();
  folders: Folder[] = [];
  documentTypes = Object.values(DocumentType).filter(value => typeof value === 'string') as string[];


  constructor(
    public activeModal: NgbActiveModal,
    private documentService: DocumentService,
    private folderService: FolderService 
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
        console.log('Debug - Input Values:', {
            documentName: this.documentName,
            documentType: this.documentType,
            folderId: this.folderId,
        });

        const document: DocumentModel = {
            id: 0,
            documentName: this.documentName,
            folderId: this.folderId,
            createdBy: 0,
            editedBy: 0,
            folder: null,
            versions: null,
            status: undefined,
            documentType: DocumentType[this.documentType as unknown as keyof typeof DocumentType] as unknown as DocumentType,
            // content: this.content, // Assuming 'content' is added to DocumentModel
        };

        console.log('Debug - Document Object to be Sent:', document);

        this.documentService.create(document).subscribe(
            (newDocument) => {
                console.log('Debug - Document Created:', newDocument);
                this.documentCreated.emit(newDocument);
                this.activeModal.close();
                if (this.documentType === DocumentType.PDF) {
                    this.generatePDF();
                }
            },
            (error) => {
                console.error('Error creating document:', error);
                alert('An error occurred while creating the document. Please try again.');
            }
        );
    } else {
        alert('Please enter all required fields');
    }
}


  generatePDF() {
    const data = document.getElementById('contentToConvert');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.save(`${this.documentName}.pdf`);
      });
    }
  }
}
