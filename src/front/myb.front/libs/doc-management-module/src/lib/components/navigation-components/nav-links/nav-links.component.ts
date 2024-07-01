import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FolderCreationComponent } from '../../Folders/folder-creation/folder-creation.component';
import { DocumentCreationComponent } from '../../document-creation/document-creation.component';
import { Folder } from '../../../models/Folder';
import { DocumentModel } from '../../../models/DocumentModel';
import { FolderService } from '../../../services/folder.service';
import { FolderDetailsComponent } from '../../Folders/folder-details/folder-details.component';
import { FolderListComponent } from "../../Folders/folder-list/folder-list.component";
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
    selector: 'myb-front-nav-links',
    standalone: true,
    templateUrl: './nav-links.component.html',
    styleUrl: './nav-links.component.css',
    imports: [
       CommonModule, 
       NgbNavModule, 
       NavLinksComponent,
      //  FolderDetailsComponent, 
       FolderListComponent,
       RouterLink
      ]
})

export class NavLinksComponent {
  folders: Folder[] = [];
  documents: DocumentModel[] = [];
  fId!: number;

  @Output() folderCreated = new EventEmitter<Folder>();
  @Output() documentCreated = new EventEmitter<DocumentModel>();
 vId!:number;
 folder: any;

  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,

  ) {}

  // ngOnInit() {
  //   this.vId = +this.route.snapshot.paramMap.get('id')!;
  //   console.log('this is  folderid from navlink ', this.vId)   
  //   this.fId = +this.route.snapshot.paramMap.get('id')!;
  //   console.log('this is  folderid from details ', this.fId)

 
  // }
  openModal(): void {
    const modalRef = this.modalService.open(FolderCreationComponent);
    modalRef.componentInstance.fId = this.vId;
    console.log('Folder ID modal:', this.vId);
    modalRef.componentInstance.folderCreated.subscribe((newFolder: Folder) => {
      this.folderCreated.emit(newFolder);
    });
  }


  // openModalDoc(): void {
  //   const modalRef = this.modalService.open(DocumentCreationComponent);
  //   modalRef.componentInstance.documentCreated.subscribe((newDoc: DocumentModel) => {
  //     this.documents = [...this.documents, newDoc];
  //     console.log('New document created:', newDoc);
  //   });
  // }
  openModalDoc(): void {
    const modalRef = this.modalService.open(DocumentCreationComponent);
    modalRef.componentInstance.folderId = this.fId; 
    // modalRef.componentInstance.parentId=this.folder.parentId;
    console.log('Passing folderId to modal:', this.fId);
    console.log('Loading parentid',this.folder.parentId);
    modalRef.componentInstance.documentCreated.subscribe((newDoc: DocumentModel) => {
      this.documents = [...this.documents, newDoc];
      console.log('New document created:', newDoc);
    });
  }
}
