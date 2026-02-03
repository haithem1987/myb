import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { AssemblyService } from '../../services/assembly.service';
import { Assembly, AssemblyStatus } from '../../models/assembly.model';

@Component({
  selector: 'app-owner-assemblies',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule
  ],
  template: `
    <div class="owner-assemblies">
      <div class="section-header">
        <h2><mat-icon>event</mat-icon> Upcoming Meetings & Agendas</h2>
      </div>

      @if (loading()) {
        <div class="loading">Loading assemblies...</div>
      } @else if (upcomingAssemblies().length === 0) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>info</mat-icon>
            <p>No upcoming meetings scheduled.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="assemblies-grid">
          @for (assembly of upcomingAssemblies(); track assembly.id) {
            <mat-card class="assembly-card">
              <mat-card-header>
                <mat-card-title>{{ assembly.title }}</mat-card-title>
                <mat-chip [class]="'type-' + assembly.assemblyType.toLowerCase()">
                  {{ assembly.assemblyType }}
                </mat-chip>
              </mat-card-header>
              <mat-card-content>
                <div class="assembly-info">
                  <div class="info-item">
                    <mat-icon>calendar_today</mat-icon>
                    <span>{{ assembly.meetingDate | date:'fullDate' }}</span>
                  </div>
                  <div class="info-item">
                    <mat-icon>access_time</mat-icon>
                    <span>{{ assembly.meetingDate | date:'shortTime' }}</span>
                  </div>
                  @if (assembly.location) {
                    <div class="info-item">
                      <mat-icon>location_on</mat-icon>
                      <span>{{ assembly.location }}</span>
                    </div>
                  }
                </div>
                @if (assembly.agenda) {
                  <div class="agenda-preview">
                    <h4>Agenda:</h4>
                    <p>{{ assembly.agenda }}</p>
                  </div>
                }
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="viewDetails(assembly.id)">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-button (click)="viewAgenda(assembly)">
                  <mat-icon>description</mat-icon>
                  View Agenda
                </button>
                <button mat-button (click)="addToCalendar(assembly)">
                  <mat-icon>add_to_calendar</mat-icon>
                  Add to Calendar
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      <!-- Past Meetings Section -->
      <div class="section-header mt-4">
        <h3><mat-icon>history</mat-icon> Past Meetings</h3>
      </div>

      @if (pastAssemblies().length === 0) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>info</mat-icon>
            <p>No past meetings.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="past-assemblies-list">
          @for (assembly of pastAssemblies().slice(0, 5); track assembly.id) {
            <mat-card class="past-assembly-item">
              <mat-card-content>
                <div class="assembly-summary">
                  <div>
                    <strong>{{ assembly.title }}</strong>
                    <span class="date">{{ assembly.meetingDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="actions">
                    <button mat-button (click)="viewMinutes(assembly)">
                      <mat-icon>description</mat-icon>
                      View Minutes
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .owner-assemblies {
      padding: 16px;
    }

    .section-header {
      margin-bottom: 16px;

      h2, h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-weight: 500;

        mat-icon {
          color: #1976d2;
        }
      }
    }

    .assemblies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .assembly-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .assembly-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: rgba(0, 0, 0, 0.6);
          }

          span {
            font-size: 14px;
          }
        }
      }

      .agenda-preview {
        margin-top: 12px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;

        h4 {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 500;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.7);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .type-ordinary {
        background-color: #4caf50;
        color: white;
      }

      .type-extraordinary {
        background-color: #ff9800;
        color: white;
      }
    }

    .past-assemblies-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .past-assembly-item {
      .assembly-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .date {
          margin-left: 12px;
          color: rgba(0, 0, 0, 0.6);
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: rgba(0, 0, 0, 0.3);
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .loading {
      text-align: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.6);
    }

    .mt-4 {
      margin-top: 32px;
    }

    @media (max-width: 768px) {
      .assemblies-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OwnerAssembliesComponent implements OnInit {
  @Input() copropertyId!: string;

  private assemblyService = inject(AssemblyService);

  upcomingAssemblies = signal<Assembly[]>([]);
  pastAssemblies = signal<Assembly[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    if (this.copropertyId) {
      this.loadAssemblies();
    }
  }

  private loadAssemblies(): void {
    this.loading.set(true);

    // Load upcoming assemblies
    this.assemblyService.getUpcomingAssemblies(this.copropertyId).subscribe({
      next: (assemblies) => {
        this.upcomingAssemblies.set(assemblies);
      },
      error: (error) => console.error('Error loading upcoming assemblies:', error)
    });

    // Load all assemblies to filter past ones
    this.assemblyService.getAssemblies(this.copropertyId).subscribe({
      next: (assemblies) => {
        const now = new Date();
        const past = assemblies.filter(a => new Date(a.meetingDate) < now && a.status === AssemblyStatus.COMPLETED);
        this.pastAssemblies.set(past);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading assemblies:', error);
        this.loading.set(false);
      }
    });
  }

  viewDetails(assemblyId: string): void {
    // TODO: Navigate to assembly details page or open dialog
    console.log('View assembly details:', assemblyId);
  }

  viewAgenda(assembly: Assembly): void {
    // TODO: Open dialog or navigate to agenda view
    console.log('View agenda for:', assembly.title);
    // Could open a dialog showing the full agenda content
  }

  addToCalendar(assembly: Assembly): void {
    // Create an ICS file for calendar download
    const event = {
      title: assembly.title,
      start: new Date(assembly.meetingDate),
      duration: { hours: 2 }, // Default 2 hours
      location: assembly.location || '',
      description: assembly.agenda || ''
    };

    // Generate ICS content
    const icsContent = this.generateICS(event);
    
    // Create download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `assembly-${assembly.id}.ics`;
    link.click();
  }

  viewMinutes(assembly: Assembly): void {
    // TODO: Open dialog or navigate to minutes view
    console.log('View minutes for:', assembly.title);
  }

  private generateICS(event: any): string {
    const startDate = this.formatICSDate(event.start);
    const endDate = this.formatICSDate(new Date(event.start.getTime() + (event.duration.hours * 60 * 60 * 1000)));

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MYB Coproperty//EN
BEGIN:VEVENT
UID:${Date.now()}@myb-coproperty.com
DTSTAMP:${this.formatICSDate(new Date())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
LOCATION:${event.location}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;
  }

  private formatICSDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }
}
