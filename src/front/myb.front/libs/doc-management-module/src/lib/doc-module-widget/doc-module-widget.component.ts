import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavLinksComponent } from '../components/navigation-components/nav-links/nav-links.component';
import { FolderListComponent } from '../components/Folders/folder-list/folder-list.component';
import { BreadcrumbComponent } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-front-doc-module-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavLinksComponent,
    BreadcrumbComponent,
    FolderListComponent,
  ],
  templateUrl: './doc-module-widget.component.html',
  styleUrl: './doc-module-widget.component.css',
})
export class DocModuleWidgetComponent {}
