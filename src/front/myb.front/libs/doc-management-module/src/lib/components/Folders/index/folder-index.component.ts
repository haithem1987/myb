import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FolderCardsComponent } from '../folder-cards/folder-cards.component';

@Component({
  selector: 'myb-front-folder-index',
  standalone: true,
  imports: [CommonModule, RouterOutlet,FolderCardsComponent],
  templateUrl: './folder-index.component.html',
  styleUrl: './folder-index.component.css',
})
export class FolderIndexComponent {}
