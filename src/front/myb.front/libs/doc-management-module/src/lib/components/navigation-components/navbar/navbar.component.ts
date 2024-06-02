import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Folder } from '../../../models/Folder';
import { FolderCreationComponent } from '../../Folders/folder-creation/folder-creation.component';

@Component({
  selector: 'myb-front-navbar',
  standalone: true,
  imports: [CommonModule,RouterModule, NgbDropdownModule,NgbModalModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @Output() folderCreated = new EventEmitter<Folder>();
  folders: Folder[] = [];

  constructor(private modalService: NgbModal) {}

  
}
