import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Folder } from '../../../models/Folder';
import { FormsModule } from '@angular/forms';
import { FolderService } from '../../../services/folder.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { KeycloakProfile } from 'keycloak-js';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-folder-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folder-creation.component.html',
  styleUrl: './folder-creation.component.css',
})
export class FolderCreationComponent {
  folderName: string = '';
  @Output() folderCreated = new EventEmitter<Folder>();
  @Input() folderId!: number;
  //@Input() userId!: string;
  user$: Observable<KeycloakProfile | null>;

  constructor(
    public activeModal: NgbActiveModal,
    private folderService: FolderService,
    private route: ActivatedRoute,
    private keycloakService: KeycloakService 
  ) {
    this.user$ = this.keycloakService.profile$;

  }

  
  ngOnInit() {
    console.log('Received folderId from details:', this.folderId);
   
    
  }

  createFolder(): void {
    if (this.folderName) {
      this.user$.subscribe({
        next: (userProfile) => {
          if (userProfile) {
            const folder = {
              folderName: this.folderName,
              parentId: this.folderId,
              createdBy: userProfile.username,
              editedBy:  userProfile.username,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Folder;

            this.folderService.create(folder).subscribe({
              next: (newFolder) => {
                this.folderCreated.emit(newFolder);
                this.activeModal.close();
                console.log('userProfile.email', userProfile.email)
                console.log('creation id', newFolder.id);
                console.log('creation parentId:', newFolder.parentId);
                console.log('first', this.folderService.folders$);
              },
              error: (error) => {
                console.error('Error creating folder:', error);
              },
            });
          }
        },
      });

    }}}