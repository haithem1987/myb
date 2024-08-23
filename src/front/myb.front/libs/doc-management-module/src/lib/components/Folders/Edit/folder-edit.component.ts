import { Folder } from './../../../models/Folder';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FolderService } from '../../../services/folder.service';
import { KeycloakProfile } from 'keycloak-js';
import { Observable, take } from 'rxjs';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Component({
  selector: 'myb-front-folder-edit',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './folder-edit.component.html',
  styleUrl: './folder-edit.component.css',
})
export class FolderEditComponent implements OnInit {
  @Output() folderUpdated = new EventEmitter<Folder>();
  folderName: string = '';
  @Input() folder!: Folder; 
  user$: Observable<KeycloakProfile | null>;

  constructor(
    public activeModal: NgbActiveModal,
    private folderService: FolderService,
    private keycloakService: KeycloakService

  ) {
    this.user$ = this.keycloakService.profile$;

  }

  ngOnInit(): void {
    if (this.folder) {
      this.folderName = this.folder.folderName;
    }
    console.log('FolderEditComponent initialized', this.folderName);
  }

  editFolder(): void {
    if (this.folder && this.user$) {
      this.user$.pipe(take(1)).subscribe((userProfile) => {
        if (userProfile && this.folder) {
          const updatedFolder = {
            ...this.folder,
            folderName: this.folderName,
            editedBy: userProfile.username || 'Unknown User',
            updatedAt: new Date(),
          };

          this.folderService.update(this.folder.id, updatedFolder).subscribe(
            (updatedFo) => {
              this.folderUpdated.emit(updatedFo);
              console.log('Updated Folder:', updatedFo);
              this.activeModal.close();
            },
            (error) => {
              console.error('Error updating folder:', error);
            }
          );
        } else {
          console.error('User profile or folder is missing.');
        }
      });
    }
  }
  
  
}
