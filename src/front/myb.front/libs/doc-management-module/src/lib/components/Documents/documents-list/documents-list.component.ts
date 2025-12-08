import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Folder } from '../../../models/Folder';

@Component({
  selector: 'myb-front-documents-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-list.component.html',
  styleUrl: './documents-list.component.css',
})
export class DocumentsListComponent {
 folders: Folder[] = [];

}
