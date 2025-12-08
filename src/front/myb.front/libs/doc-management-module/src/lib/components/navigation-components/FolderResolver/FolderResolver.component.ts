import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Folder } from '../../../models/Folder';
import { FolderService } from '../../../services/folder.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-folder-resolver',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './FolderResolver.component.html',
  styleUrl: './FolderResolver.component.css',
})
export class FolderResolverComponent implements Resolve<Folder> {
  constructor(private folderService: FolderService) {}


}
