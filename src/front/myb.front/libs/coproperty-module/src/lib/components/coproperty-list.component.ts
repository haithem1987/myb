import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CopropertyService } from '../services/coproperty.service';
import { Coproperty } from '../models/coproperty.models';

@Component({
  selector: 'myb-coproperty-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1>{{ 'COPROPERTY_MANAGEMENT' | translate }}</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="addCoproperty()">
            {{ 'ADD_COPROPERTY' | translate }}
          </button>
        </div>
      </div>

      <div *ngIf="coproperties$ | async as copropertiesList" class="row">
        <div
          *ngFor="let coproperty of copropertiesList"
          class="col-md-6 col-lg-4 mb-4"
        >
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">{{ coproperty.name }}</h5>
              <p class="card-text text-muted">{{ coproperty.address }}</p>
              <p class="card-text">
                <strong>{{ 'UNITS' | translate }}:</strong> {{ coproperty.totalUnits }}
              </p>
              <p class="card-text">
                <strong>{{ 'SHARES' | translate }}:</strong> {{ coproperty.totalShares }}
              </p>
              <div class="btn-group w-100" role="group">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  (click)="viewDetails(coproperty.id)"
                >
                  {{ 'VIEW' | translate }}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-warning"
                  (click)="editCoproperty(coproperty.id)"
                >
                  {{ 'EDIT' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!(coproperties$ | async)" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">{{ 'LOADING' | translate }}</span>
        </div>
      </div>
    </div>
  `,
})
export class CopropertyListComponent {
  coproperties$: Observable<Coproperty[]>;

  constructor(
    private copropertyService: CopropertyService,
    private router: Router
  ) {
    this.coproperties$ = this.copropertyService.getCoproperties();
  }

  viewDetails(id: string): void {
    this.router.navigate(['/coproperty', id]);
  }

  editCoproperty(id: string): void {
    this.router.navigate(['/coproperty', id, 'edit']);
  }

  addCoproperty(): void {
    this.router.navigate(['/coproperty/new']);
  }
}
