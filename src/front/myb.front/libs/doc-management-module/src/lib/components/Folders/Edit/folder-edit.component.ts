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
  @Input() folder!: Folder; // Marked as @Input() to receive data from parent component
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
  }

  editFolder(): void {
    if (this.folder && this.user$) {
      this.user$.pipe(take(1)).subscribe((userProfile) => {
        if (userProfile && this.folder) {
          this.folder.folderName = this.folderName;
          this.folder.editedBy = userProfile.username || 'Unknown User'; 
          this.folderService.update(this.folder.id, this.folder).subscribe((folder) => {
            this.folderUpdated.emit(folder);
            this.activeModal.close();
          });
        } else {
          console.error('User profile or folder is missing.');
        }
      });
    }
  }
  
  
}
