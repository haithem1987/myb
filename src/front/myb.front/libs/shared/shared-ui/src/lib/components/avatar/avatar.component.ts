import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
const colors = [
  '#E57373', // Red
  '#F06292', // Pink
  '#BA68C8', // Purple
  '#9575CD', // Deep Purple
  '#7986CB', // Indigo
  '#64B5F6', // Blue
  '#4FC3F7', // Light Blue
  '#4DD0E1', // Cyan
  '#4DB6AC', // Teal
  '#81C784', // Green
  '#AED581', // Light Green
  '#DCE775', // Lime
  '#FFF176', // Yellow
  '#FFD54F', // Amber
  '#FFB74D', // Orange
  '#FF8A65', // Deep Orange
  '#A1887F', // Brown
  '#E0E0E0', // Grey
  '#90A4AE', // Blue Grey
  '#BDBDBD', // Light Grey
];
@Component({
  selector: 'myb-front-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  @Input() text?: string;
  @Input() imageUrl?: string;
  @Input() size: number = 35;

  getAvatarColor(text: string): string {
    const charCode = text.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  }
}
