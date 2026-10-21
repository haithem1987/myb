import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';
import { AssemblyService, CopropertyService } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';
import { Assembly, AssemblyType, AssemblyStatus, CreateAssemblyInput, Coproperty } from '@myb-front/coproperty-module';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';
import { currentIntlLocale } from 'libs/shared/infra/services/language.service';
interface GeneralAssembly {
  id: string;
  title: string;
  type: 'ordinary' | 'extraordinary';
  date: Date;
  status: 'planned' | 'convened' | 'held' | 'cancelled';
  copropertyId: string;
  copropertyName: string;
  location: string;
  attendees: number;
  totalUnits: number;
  resolutions: number;
  votesRequired: number;
  documentsCount: number;
}

@Component({
  selector: 'myb-coproperty-general-assembly',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="ag-page">
      <!-- Page Header -->
      <div class="ag-page-header">
        <div class="ag-page-header-left">
          <div class="ag-page-icon">
            <i class="bi bi-people-fill"></i>
          </div>
          <div>
            <h1 class="ag-page-title">Assemblées Générales</h1>
            <p class="ag-page-subtitle">Planification, convocations et suivi des AG</p>
          </div>
        </div>
        <button
          class="btn-ag-new"
          (click)="createAssembly()"
          [disabled]="!copropertyId || !isSelectedCopropertyActive()">
          <i class="bi bi-plus-lg"></i>
          Nouvelle AG
        </button>
      </div>

      <!-- Statistics -->
      <div class="ag-stats">
        <div class="ag-stat-card ag-stat-primary">
          <i class="bi bi-calendar-event ag-stat-icon"></i>
          <div class="ag-stat-value">{{ stats().upcoming }}</div>
          <div class="ag-stat-label">À venir</div>
        </div>
        <div class="ag-stat-card ag-stat-success">
          <i class="bi bi-check-circle ag-stat-icon"></i>
          <div class="ag-stat-value">{{ stats().held }}</div>
          <div class="ag-stat-label">Réalisées</div>
        </div>
        <div class="ag-stat-card ag-stat-warning">
          <i class="bi bi-file-earmark-check ag-stat-icon"></i>
          <div class="ag-stat-value">{{ stats().resolutions }}</div>
          <div class="ag-stat-label">Résolutions</div>
        </div>
        <div class="ag-stat-card ag-stat-info">
          <i class="bi bi-person-check ag-stat-icon"></i>
          <div class="ag-stat-value">{{ stats().avgAttendance }}%</div>
          <div class="ag-stat-label">Taux présence</div>
        </div>
      </div>

      <!-- Create/Edit Form -->
      <div class="ag-form-panel" *ngIf="showForm()">
        <div class="ag-form-header">
          <i class="bi" [ngClass]="isEditing() ? 'bi-pencil-square' : 'bi-calendar-plus'"></i>
          {{ isEditing() ? 'Modifier l\'Assemblée Générale' : 'Nouvelle Assemblée Générale' }}
          <button type="button" class="ag-form-close" (click)="cancelForm()" [disabled]="loading()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="ag-form-body">
          <form [formGroup]="assemblyForm" (ngSubmit)="saveAssembly()">
            <div class="ag-form-grid">
              <div class="ag-form-field ag-field-wide">
                <label for="title">Titre <span class="required">*</span></label>
                <input type="text" id="title" formControlName="title"
                  placeholder="Ex: Assemblée Générale Ordinaire 2026"
                  [class.is-invalid]="assemblyForm.get('title')?.invalid && assemblyForm.get('title')?.touched"/>
                <div class="invalid-feedback">Titre requis (min. 3 caractères)</div>
              </div>

              <div class="ag-form-field">
                <label for="assemblyType">Type <span class="required">*</span></label>
                <select id="assemblyType" formControlName="assemblyType">
                  <option value="Ordinary">AG Ordinaire</option>
                  <option value="Extraordinary">AG Extraordinaire</option>
                </select>
              </div>

              <div class="ag-form-field">
                <label for="meetingDate">Date <span class="required">*</span></label>
                <input type="date" id="meetingDate" formControlName="meetingDate"
                  [class.is-invalid]="assemblyForm.get('meetingDate')?.invalid && assemblyForm.get('meetingDate')?.touched"/>
                <div class="invalid-feedback">Date requise</div>
              </div>

              <div class="ag-form-field">
                <label for="meetingTime">Heure <span class="required">*</span></label>
                <input type="time" id="meetingTime" formControlName="meetingTime"
                  [class.is-invalid]="assemblyForm.get('meetingTime')?.invalid && assemblyForm.get('meetingTime')?.touched"/>
                <div class="invalid-feedback">Heure requise</div>
              </div>

              <div class="ag-form-field">
                <label for="location">Lieu <span class="required">*</span></label>
                <input type="text" id="location" formControlName="location"
                  placeholder="Ex: Salle polyvalente"
                  [class.is-invalid]="assemblyForm.get('location')?.invalid && assemblyForm.get('location')?.touched"/>
                <div class="invalid-feedback">Lieu requis</div>
              </div>

              <div class="ag-form-field ag-field-full">
                <label for="agenda">Ordre du jour</label>
                <textarea id="agenda" formControlName="agenda" rows="3"
                  placeholder="Points à aborder lors de cette assemblée..."></textarea>
              </div>
            </div>

            <div class="ag-form-actions">
              <button type="submit" class="btn-ag-save"
                [disabled]="assemblyForm.invalid || loading() || !copropertyId || !isSelectedCopropertyActive()">
                <i class="bi" [ngClass]="loading() ? 'bi-hourglass-split' : 'bi-check-lg'"></i>
                {{ isEditing() ? 'Enregistrer' : 'Créer l\'AG' }}
              </button>
              <button type="button" class="btn-ag-cancel" (click)="cancelForm()" [disabled]="loading()">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Filters -->
      <div class="ag-filters">
        <div class="ag-filter-group">
          <i class="bi bi-funnel ag-filter-icon"></i>
          <select [(ngModel)]="selectedStatus" (change)="filterAssemblies()">
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifiées</option>
            <option value="convened">Convoquées</option>
            <option value="held">Tenues</option>
            <option value="cancelled">Annulées</option>
          </select>
          <select [(ngModel)]="selectedType" (change)="filterAssemblies()">
            <option value="all">Tous les types</option>
            <option value="ordinary">AG Ordinaires</option>
            <option value="extraordinary">AG Extraordinaires</option>
          </select>
          <select [(ngModel)]="selectedYear" (change)="filterAssemblies()">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div class="ag-search">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Rechercher une AG..."
            [(ngModel)]="searchTerm" (input)="filterAssemblies()"/>
        </div>
      </div>

      <!-- Loading -->
      <div class="ag-loading" *ngIf="loading()">
        <div class="spinner-border text-primary" role="status"></div>
        <span>Chargement des assemblées...</span>
      </div>

      <!-- Empty State -->
      <div class="ag-empty" *ngIf="filteredAssemblies().length === 0 && !loading()">
        <i class="bi bi-calendar-x"></i>
        <h4>Aucune assemblée générale</h4>
        <p>{{ copropertyId ? 'Créez votre première AG pour commencer' : 'Veuillez sélectionner une copropriété' }}</p>
        <button class="btn-ag-new" *ngIf="copropertyId && isSelectedCopropertyActive()" (click)="createAssembly()">
          <i class="bi bi-plus-lg"></i> Créer une AG
        </button>
      </div>

      <!-- Assembly Cards -->
      <div class="ag-list" *ngIf="!loading()">
        <div class="ag-card" *ngFor="let assembly of filteredAssemblies()">
          <div class="ag-card-accent" [attr.data-type]="assembly.type"></div>

          <div class="ag-card-header">
            <div class="ag-card-meta">
              <span class="ag-type-badge" [attr.data-type]="assembly.type">
                {{ assembly.type === 'ordinary' ? 'Ordinaire' : 'Extraordinaire' }}
              </span>
              <span class="ag-status-badge" [attr.data-status]="assembly.status">
                <i class="bi" [ngClass]="{
                  'bi-clock': assembly.status === 'planned',
                  'bi-envelope-check': assembly.status === 'convened',
                  'bi-check-circle-fill': assembly.status === 'held',
                  'bi-x-circle': assembly.status === 'cancelled'
                }"></i>
                {{ getStatusLabel(assembly.status) }}
              </span>
            </div>
            <div class="ag-card-actions">
              <button class="ag-icon-btn" title="Voir" (click)="viewAssembly(assembly.id)">
                <i class="bi bi-eye"></i>
              </button>
              <button class="ag-icon-btn" title="Modifier" (click)="editAssembly(assembly.id)"
                [disabled]="!isSelectedCopropertyActive()">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="ag-icon-btn ag-icon-btn-danger" title="Supprimer"
                (click)="deleteAssembly(assembly.id)" [disabled]="!isSelectedCopropertyActive()">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>

          <h3 class="ag-card-title">{{ assembly.title }}</h3>
          <p class="ag-card-coproperty" *ngIf="assembly.copropertyName">
            <i class="bi bi-building"></i> {{ assembly.copropertyName }}
          </p>

          <div class="ag-card-info">
            <div class="ag-info-item">
              <i class="bi bi-calendar3"></i>
              <span>{{ assembly.date | date:'dd/MM/yyyy' }}</span>
              <span class="ag-info-time">{{ assembly.date | date:'HH:mm' }}</span>
            </div>
            <div class="ag-info-item">
              <i class="bi bi-geo-alt"></i>
              <span>{{ assembly.location }}</span>
            </div>
            <div class="ag-info-item" *ngIf="assembly.totalUnits > 0">
              <i class="bi bi-people"></i>
              <span>{{ assembly.attendees }}/{{ assembly.totalUnits }} présents</span>
            </div>
          </div>

          <div class="ag-card-footer">
            <div class="ag-card-workflow">
              <button class="btn-ag-action btn-convoke" *ngIf="assembly.status === 'planned'"
                (click)="sendConvocations(assembly.id)" [disabled]="!isSelectedCopropertyActive()">
                <i class="bi bi-send"></i> Envoyer convocations
              </button>
              <button class="btn-ag-action btn-start" *ngIf="assembly.status === 'convened'"
                (click)="startAssembly(assembly.id)" [disabled]="!isSelectedCopropertyActive()">
                <i class="bi bi-play-circle"></i> Démarrer l'AG
              </button>
              <button class="btn-ag-action btn-pv" *ngIf="assembly.status === 'held'"
                (click)="viewMinutes(assembly.id)">
                <i class="bi bi-file-earmark-text"></i> Voir le PV
              </button>
              <button class="btn-ag-action btn-docs" (click)="downloadDocuments(assembly.id)">
                <i class="bi bi-download"></i> Documents
              </button>
            </div>
            <div class="ag-countdown" *ngIf="assembly.status === 'convened'">
              <i class="bi bi-clock"></i> {{ getDaysUntil(assembly.date) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Page layout ── */
    .ag-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── Header ── */
    .ag-page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .ag-page-header-left { display: flex; align-items: center; gap: 16px; }
    .ag-page-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .ag-page-title { font-size: 22px; font-weight: 700; margin: 0; color: #111827; }
    .ag-page-subtitle { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

    /* ── New AG button ── */
    .btn-ag-new {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: opacity .15s, transform .15s;
      white-space: nowrap;
    }
    .btn-ag-new:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .btn-ag-new:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    /* ── Stats ── */
    .ag-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .ag-stat-card {
      background: #fff;
      border-radius: 14px;
      padding: 20px;
      display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
      border-left: 4px solid transparent;
      transition: transform .15s;
    }
    .ag-stat-card:hover { transform: translateY(-2px); }
    .ag-stat-primary  { border-color: #4f46e5; }
    .ag-stat-success  { border-color: #059669; }
    .ag-stat-warning  { border-color: #d97706; }
    .ag-stat-info     { border-color: #0891b2; }
    .ag-stat-icon { font-size: 22px; }
    .ag-stat-primary  .ag-stat-icon { color: #4f46e5; }
    .ag-stat-success  .ag-stat-icon { color: #059669; }
    .ag-stat-warning  .ag-stat-icon { color: #d97706; }
    .ag-stat-info     .ag-stat-icon { color: #0891b2; }
    .ag-stat-value { font-size: 28px; font-weight: 800; color: #111827; line-height: 1; }
    .ag-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }

    /* ── Form panel ── */
    .ag-form-panel {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
      overflow: hidden;
    }
    .ag-form-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      font-size: 15px; font-weight: 600;
    }
    .ag-form-close {
      margin-left: auto;
      background: rgba(255,255,255,.2);
      border: none; border-radius: 8px;
      color: #fff; width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background .15s;
    }
    .ag-form-close:hover { background: rgba(255,255,255,.35); }
    .ag-form-body { padding: 24px; }
    .ag-form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .ag-field-wide  { grid-column: span 2; }
    .ag-field-full  { grid-column: 1 / -1; }
    .ag-form-field { display: flex; flex-direction: column; gap: 6px; }
    .ag-form-field label { font-size: 13px; font-weight: 600; color: #374151; }
    .ag-form-field input,
    .ag-form-field select,
    .ag-form-field textarea {
      padding: 9px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px; color: #111827;
      transition: border-color .15s;
      background: #fff;
    }
    .ag-form-field input:focus,
    .ag-form-field select:focus,
    .ag-form-field textarea:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
    }
    .ag-form-field input.is-invalid,
    .ag-form-field select.is-invalid { border-color: #ef4444; }
    .required { color: #ef4444; }
    .invalid-feedback { font-size: 12px; color: #ef4444; }
    .ag-form-actions { display: flex; gap: 10px; margin-top: 20px; }
    .btn-ag-save {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 24px;
      background: #059669; color: #fff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity .15s;
    }
    .btn-ag-save:hover:not(:disabled) { opacity: .9; }
    .btn-ag-save:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ag-cancel {
      padding: 10px 20px;
      background: #f3f4f6; color: #374151;
      border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .15s;
    }
    .btn-ag-cancel:hover:not(:disabled) { background: #e5e7eb; }

    /* ── Filters ── */
    .ag-filters {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      background: #fff;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .ag-filter-group { display: flex; align-items: center; gap: 10px; }
    .ag-filter-icon { color: #6b7280; font-size: 16px; }
    .ag-filter-group select,
    .ag-search input {
      padding: 7px 12px;
      border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: 13px; color: #374151;
      background: #f9fafb;
      cursor: pointer;
      transition: border-color .15s;
    }
    .ag-filter-group select:focus,
    .ag-search input:focus { outline: none; border-color: #4f46e5; }
    .ag-search {
      display: flex; align-items: center;
      gap: 8px;
      background: #f9fafb;
      border: 1.5px solid #e5e7eb; border-radius: 8px;
      padding: 0 12px;
    }
    .ag-search i { color: #9ca3af; }
    .ag-search input { border: none; background: transparent; padding: 7px 0; }
    .ag-search input:focus { box-shadow: none; }

    /* ── Loading / Empty ── */
    .ag-loading {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      padding: 60px;
      color: #6b7280;
    }
    .ag-empty {
      text-align: center;
      padding: 80px 24px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .ag-empty i { font-size: 56px; color: #d1d5db; display: block; margin-bottom: 16px; }
    .ag-empty h4 { font-size: 18px; color: #374151; margin-bottom: 6px; }
    .ag-empty p { color: #6b7280; margin-bottom: 20px; }

    /* ── Assembly cards ── */
    .ag-list { display: flex; flex-direction: column; gap: 16px; }
    .ag-card {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
      overflow: hidden;
      display: flex; flex-direction: column;
      position: relative;
      padding: 0 20px 20px;
      transition: box-shadow .2s, transform .2s;
    }
    .ag-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-1px); }
    .ag-card-accent {
      position: absolute; top: 0; left: 0; right: 0; height: 4px;
    }
    .ag-card-accent[data-type="ordinary"]     { background: linear-gradient(90deg, #4f46e5, #7c3aed); }
    .ag-card-accent[data-type="extraordinary"] { background: linear-gradient(90deg, #d97706, #f59e0b); }

    .ag-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 20px; margin-bottom: 10px;
    }
    .ag-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .ag-type-badge {
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
    }
    .ag-type-badge[data-type="ordinary"]      { background: #ede9fe; color: #5b21b6; }
    .ag-type-badge[data-type="extraordinary"] { background: #fef3c7; color: #92400e; }

    .ag-status-badge {
      display: flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600;
    }
    .ag-status-badge[data-status="planned"]   { background: #dbeafe; color: #1d4ed8; }
    .ag-status-badge[data-status="convened"]  { background: #e0e7ff; color: #4338ca; }
    .ag-status-badge[data-status="held"]      { background: #d1fae5; color: #065f46; }
    .ag-status-badge[data-status="cancelled"] { background: #f3f4f6; color: #6b7280; }

    .ag-card-actions { display: flex; gap: 6px; }
    .ag-icon-btn {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #e5e7eb; border-radius: 8px;
      background: #fff; color: #374151;
      cursor: pointer; font-size: 14px;
      transition: background .15s, border-color .15s, color .15s;
    }
    .ag-icon-btn:hover:not(:disabled)           { background: #f3f4f6; border-color: #d1d5db; }
    .ag-icon-btn-danger:hover:not(:disabled)    { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
    .ag-icon-btn:disabled                       { opacity: .4; cursor: not-allowed; }

    .ag-card-title {
      font-size: 16px; font-weight: 700; color: #111827;
      margin: 0 0 4px;
    }
    .ag-card-coproperty {
      font-size: 13px; color: #6b7280; margin: 0 0 12px;
      display: flex; align-items: center; gap: 6px;
    }

    .ag-card-info {
      display: flex; flex-wrap: wrap; gap: 16px;
      padding: 12px 0;
      border-top: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
      margin-bottom: 14px;
    }
    .ag-info-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #374151;
    }
    .ag-info-item i { color: #9ca3af; }
    .ag-info-time { color: #6b7280; margin-left: 2px; }

    .ag-card-footer {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 8px;
    }
    .ag-card-workflow { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-ag-action {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: 1.5px solid transparent;
      transition: opacity .15s, transform .1s;
    }
    .btn-ag-action:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
    .btn-ag-action:disabled { opacity: .4; cursor: not-allowed; transform: none; }
    .btn-convoke { background: #ede9fe; color: #5b21b6; border-color: #c4b5fd; }
    .btn-start   { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
    .btn-pv      { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }
    .btn-docs    { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
    .ag-countdown { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 5px; }

    /* ── Responsive ── */
    @media (max-width: 992px) {
      .ag-stats { grid-template-columns: repeat(2, 1fr); }
      .ag-form-grid { grid-template-columns: repeat(2, 1fr); }
      .ag-field-wide { grid-column: span 1; }
    }
    @media (max-width: 768px) {
      .ag-page { padding: 16px; gap: 16px; }
      .ag-page-title { font-size: 18px; }
      .ag-page-subtitle { display: none; }
      .ag-filters { flex-direction: column; align-items: stretch; }
      .ag-filter-group { flex-wrap: wrap; }
      .ag-search { width: 100%; }
    }
    @media (max-width: 576px) {
      .ag-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .ag-stat-value { font-size: 22px; }
      .ag-form-grid { grid-template-columns: 1fr; }
      .ag-field-wide { grid-column: span 1; }
      .ag-card-footer { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class GeneralAssemblyComponent implements OnInit {
  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);
  private assemblyService = inject(AssemblyService);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private activeCoproperty = inject(ActiveCopropertyService);

  selectedStatus = 'all';
  selectedType = 'all';
  selectedYear = '2026';
  searchTerm = '';
  copropertyId: string | null = null;
  selectedCopropertyId: string = '';
  showForm = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentAssemblyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  availableCoproperties = signal<Coproperty[]>([]);

  assemblyForm: FormGroup;

  stats = signal({
    upcoming: 0,
    held: 0,
    resolutions: 0,
    avgAttendance: 0
  });

  assemblies = signal<GeneralAssembly[]>([]);

  filteredAssemblies = signal<GeneralAssembly[]>([]);

  constructor() {
    this.assemblyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      assemblyType: ['Ordinary', Validators.required],
      meetingDate: ['', Validators.required],
      meetingTime: ['18:30', Validators.required],
      location: ['', Validators.required],
      agenda: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.copropertyId = params['copropertyId'] || null;
      if (this.copropertyId) {
        this.loadAssemblies();
      }
    });

    this.loadCoproperties();
  }

  loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).subscribe({
      next: (coproperties) => {
        this.availableCoproperties.set(coproperties);
        this.selectedCopropertyId = this.activeCoproperty.selectAvailable(coproperties, this.copropertyId);
        if (this.selectedCopropertyId && !this.copropertyId) this.onCopropertyChange();
      },
      error: (error) => {
        console.error('Error loading coproperties:', error);
        this.toastService.show('Erreur lors du chargement des copropriétés', { classname: 'toast-danger' });
      }
    });
  }

  onCopropertyChange(): void {
    if (this.selectedCopropertyId) {
      this.activeCoproperty.setActive(this.selectedCopropertyId);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { copropertyId: this.selectedCopropertyId },
        queryParamsHandling: 'merge'
      });
    }
  }

  loadAssemblies(): void {
    if (!this.copropertyId) return;
    
    this.loading.set(true);
    this.assemblyService.getAssemblies(this.copropertyId).subscribe({
      next: (assemblies) => {
        // Transform real data to match the UI format
        const transformedAssemblies = assemblies.map(a => this.transformAssembly(a));
        this.assemblies.set(transformedAssemblies);
        this.filteredAssemblies.set(transformedAssemblies);
        this.calculateStats(transformedAssemblies);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading assemblies:', error);
        this.toastService.show('Erreur lors du chargement des assemblées', { classname: 'toast-danger' });
        this.loading.set(false);
      }
    });
  }

  transformAssembly(assembly: Assembly): GeneralAssembly {
    const coproperty = this.availableCoproperties().find(c => c.id === assembly.copropertyId);
    return {
      id: assembly.id,
      title: assembly.title,
      type: assembly.assemblyType === AssemblyType.ORDINARY ? 'ordinary' : 'extraordinary',
      date: new Date(assembly.meetingDate),
      status: this.mapStatus(assembly.status),
      copropertyId: assembly.copropertyId,
      copropertyName: coproperty?.name ?? '',
      location: assembly.location || 'Non défini',
      attendees: assembly.attendances?.filter(a => a.isPresent).length || 0,
      totalUnits: assembly.attendances?.length || 0,
      resolutions: 0,
      votesRequired: 0,
      documentsCount: 0
    };
  }

  mapStatus(status: AssemblyStatus): 'planned' | 'convened' | 'held' | 'cancelled' {
    switch (status) {
      case AssemblyStatus.SCHEDULED: return 'planned';
      case AssemblyStatus.IN_PROGRESS: return 'convened';
      case AssemblyStatus.COMPLETED: return 'held';
      case AssemblyStatus.CANCELLED: return 'cancelled';
      default: return 'planned';
    }
  }

  calculateStats(assemblies: GeneralAssembly[]): void {
    const now = new Date();
    const upcoming = assemblies.filter(a => a.date > now && a.status !== 'cancelled').length;
    const held = assemblies.filter(a => a.status === 'held').length;
    const totalResolutions = assemblies.reduce((sum, a) => sum + a.resolutions, 0);
    const avgAttendance = assemblies.length > 0
      ? Math.round(assemblies.reduce((sum, a) => sum + (a.attendees / (a.totalUnits || 1) * 100), 0) / assemblies.length)
      : 0;

    this.stats.set({
      upcoming,
      held,
      resolutions: totalResolutions,
      avgAttendance
    });
  }

  filterAssemblies() {
    let filtered = this.assemblies();

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }

    if (this.selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.copropertyName.toLowerCase().includes(term)
      );
    }

    this.filteredAssemblies.set(filtered);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      planned: 'Planifiée',
      convened: 'Convoquée',
      held: 'Tenue',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  getDaysUntil(date: Date): string {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Demain";
    if (days < 0) return `Il y a ${Math.abs(days)} jours`;
    return `Dans ${days} jours`;
  }

  showAddForm(): void {
    this.isEditing.set(false);
    this.currentAssemblyId.set(null);
    this.assemblyForm.reset({
      title: '',
      assemblyType: 'Ordinary',
      meetingDate: '',
      meetingTime: '18:30',
      location: '',
      agenda: ''
    });
    this.showForm.set(true);
  }

  createAssembly(): void {
    if (!this.isSelectedCopropertyActive()) return;
    this.showAddForm();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.assemblyForm.reset();
  }

  saveAssembly(): void {
    if (!this.isSelectedCopropertyActive()) return;
    if (this.assemblyForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.assemblyForm.controls).forEach(key => {
        this.assemblyForm.get(key)?.markAsTouched();
      });
      this.toastService.show('Formulaire invalide - vérifiez les champs', { classname: 'toast-warning' });
      return;
    }
    
    if (!this.copropertyId) {
      this.toastService.show('Copropriété non sélectionnée', { classname: 'toast-danger' });
      return;
    }

    const formValue = this.assemblyForm.value;
    const meetingDateTime = this.combineDateAndTime(formValue.meetingDate, formValue.meetingTime);

    const input: CreateAssemblyInput = {
      copropertyId: this.copropertyId,
      title: formValue.title,
      meetingDate: meetingDateTime,
      location: formValue.location,
      agenda: formValue.agenda,
      assemblyType: formValue.assemblyType === 'Ordinary' ? AssemblyType.ORDINARY : AssemblyType.EXTRAORDINARY
    };

    this.loading.set(true);

    if (this.isEditing() && this.currentAssemblyId()) {
      this.assemblyService.updateAssembly(this.currentAssemblyId()!, input).subscribe({
        next: () => {
          this.toastService.show('Assemblée générale modifiée avec succès', { classname: 'toast-success' });
          this.loadAssemblies();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error updating assembly:', error);
          this.toastService.show('Erreur lors de la modification', { classname: 'toast-danger' });
          this.loading.set(false);
        }
      });
    } else {
      this.assemblyService.createAssembly(input).subscribe({
        next: () => {
          this.toastService.show('Assemblée générale créée avec succès', { classname: 'toast-success' });
          this.loadAssemblies();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error creating assembly:', error);
          this.toastService.show('Erreur lors de la création', { classname: 'toast-danger' });
          this.loading.set(false);
        }
      });
    }
  }

  combineDateAndTime(dateStr: string, timeStr: string): Date {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  }

  viewAssembly(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.modalService.open({
      title: assembly.title,
      message: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Type:</strong> ${assembly.type === 'ordinary' ? 'Ordinaire' : 'Extraordinaire'}</p>
          <p><strong>Date:</strong> ${assembly.date.toLocaleDateString(currentIntlLocale())}</p>
          <p><strong>Lieu:</strong> ${assembly.location}</p>
          <p><strong>Statut:</strong> ${this.getStatusLabel(assembly.status)}</p>
          <p><strong>Participants:</strong> ${assembly.attendees}/${assembly.totalUnits}</p>
          <p><strong>Résolutions:</strong> ${assembly.resolutions}</p>
        </div>
      `,
      size: 'md',
      showCancelButton: false
    });
  }

  async editAssembly(id: string): Promise<void> {
    if (!this.isSelectedCopropertyActive()) return;
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.isEditing.set(true);
    this.currentAssemblyId.set(id);

    // Extract time from date
    const date = new Date(assembly.date);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);

    this.assemblyForm.patchValue({
      title: assembly.title,
      assemblyType: assembly.type === 'ordinary' ? 'Ordinary' : 'Extraordinary',
      meetingDate: dateStr,
      meetingTime: timeStr,
      location: assembly.location,
      agenda: '' // Will need to fetch from backend
    });

    this.showForm.set(true);
  }

  async deleteAssembly(id: string): Promise<void> {
    if (!this.isSelectedCopropertyActive()) return;
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    const confirmed = await this.modalService.confirm({
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'AG "${assembly.title}"?`,
      confirmButtonText: 'Supprimer',
      confirmButtonClass: 'btn-danger'
    });

    if (confirmed) {
      this.loading.set(true);
      this.assemblyService.deleteAssembly(id).subscribe({
        next: () => {
          this.toastService.show('L\'assemblée a été supprimée', { classname: 'toast-success' });
          this.loadAssemblies();
        },
        error: (error) => {
          console.error('Error deleting assembly:', error);
          this.toastService.show('Erreur lors de la suppression', { classname: 'toast-danger' });
          this.loading.set(false);
        }
      });
    }
  }

  async sendConvocations(id: string): Promise<void> {
    if (!this.isSelectedCopropertyActive()) return;
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    const confirmed = await this.modalService.confirm({
      title: 'Envoyer les convocations',
      message: `Envoyer les convocations à tous les copropriétaires pour "${assembly.title}" ?`,
      confirmButtonText: 'Envoyer'
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.assemblyService.updateAssemblyStatus(id, AssemblyStatus.IN_PROGRESS).subscribe({
      next: () => {
        this.toastService.show('Convocations envoyées', { classname: 'toast-success' });
        this.loadAssemblies();
      },
      error: () => {
        this.toastService.show('Erreur lors de l\'envoi des convocations', { classname: 'toast-danger' });
        this.loading.set(false);
      }
    });
  }

  async startAssembly(id: string): Promise<void> {
    if (!this.isSelectedCopropertyActive()) return;
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    const confirmed = await this.modalService.confirm({
      title: 'Démarrer l\'assemblée',
      message: `Confirmer le démarrage de "${assembly.title}" ? Cette action marque l'AG comme tenue.`,
      confirmButtonText: 'Démarrer'
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.assemblyService.updateAssemblyStatus(id, AssemblyStatus.COMPLETED).subscribe({
      next: () => {
        this.toastService.show('Assemblée démarrée', { classname: 'toast-success' });
        this.loadAssemblies();
      },
      error: () => {
        this.toastService.show('Erreur lors du démarrage', { classname: 'toast-danger' });
        this.loading.set(false);
      }
    });
  }

  viewMinutes(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.fileService.downloadPDF(
      `PV_${assembly.title.replace(/\s+/g, '_')}.pdf`,
      `Procès-verbal ${assembly.title}`
    );
    this.toastService.show('PV téléchargé', { classname: 'toast-success' });
  }

  downloadDocuments(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.fileService.downloadPDF(
      `Documents_${assembly.title.replace(/\s+/g, '_')}.pdf`,
      `Documents ${assembly.title}`
    );
    this.toastService.show(`${assembly.documentsCount} documents téléchargés`, { classname: 'toast-success' });
  }

  async manageResolutions(id: string): Promise<void> {
    if (!this.isSelectedCopropertyActive()) return;
    await this.modalService.alert(
      'Gestion des résolutions',
      'Interface de gestion des résolutions en cours de développement'
    );
  }

  isSelectedCopropertyActive(): boolean {
    return !!this.copropertyId && this.availableCoproperties().some(
      coproperty => coproperty.id === this.copropertyId && coproperty.isActive
    );
  }
}
