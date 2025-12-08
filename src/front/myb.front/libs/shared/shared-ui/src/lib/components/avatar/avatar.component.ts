import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
// const colors = [
//   '#E57373', // Red
//   '#F06292', // Pink
//   '#BA68C8', // Purple
//   '#9575CD', // Deep Purple
//   '#7986CB', // Indigo
//   '#64B5F6', // Blue
//   '#4FC3F7', // Light Blue
//   '#4DD0E1', // Cyan
//   '#4DB6AC', // Teal
//   '#81C784', // Green
//   '#AED581', // Light Green
//   '#DCE775', // Lime
//   '#FFF176', // Yellow
//   '#FFD54F', // Amber
//   '#FFB74D', // Orange
//   '#FF8A65', // Deep Orange
//   '#A1887F', // Brown
//   '#E0E0E0', // Grey
//   '#90A4AE', // Blue Grey
//   '#BDBDBD', // Light Grey
// ];
const colors = [
  '#FFB6C1',
  '#FF69B4',
  '#FF1493',
  '#DB7093',
  '#C71585',
  '#FFA07A',
  '#FA8072',
  '#E9967A',
  '#F08080',
  '#CD5C5C',
  '#DC143C',
  '#B22222',
  '#FF4500',
  '#FF8C00',
  '#FFA500',
  '#FFD700',
  '#FFFF00',
  '#ADFF2F',
  '#7FFF00',
  '#7CFC00',
  '#00FF00',
  '#32CD32',
  '#00FA9A',
  '#00FF7F',
  '#3CB371',
  '#2E8B57',
  '#228B22',
  '#006400',
  '#9ACD32',
  '#6B8E23',
  '#556B2F',
  '#66CDAA',
  '#8FBC8B',
  '#20B2AA',
  '#008B8B',
  '#008080',
  '#00CED1',
  '#40E0D0',
  '#48D1CC',
  '#AFEEEE',
  '#7FFFD4',
  '#B0E0E6',
  '#ADD8E6',
  '#87CEEB',
  '#87CEFA',
  '#4682B4',
  '#4169E1',
  '#0000FF',
  '#0000CD',
  '#00008B',
  '#000080',
  '#191970',
  '#8A2BE2',
  '#9932CC',
  '#9400D3',
  '#800080',
  '#9370DB',
  '#DDA0DD',
  '#EE82EE',
  '#DA70D6',
  '#FF00FF',
  '#BA55D3',
  '#D8BFD8',
  '#E6E6FA',
  '#DCDCDC',
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
