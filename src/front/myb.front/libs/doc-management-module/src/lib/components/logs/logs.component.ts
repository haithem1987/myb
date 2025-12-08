import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Folder } from '../../models/Folder';

@Component({
  selector: 'myb-front-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class LogsComponent {
  @Input() folders: Folder[] = [];

}
