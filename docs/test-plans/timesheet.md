# Feuilles de temps (time-sheet)

**Sources** : `Myb.Timesheet.Infra/GraphQl/Mutations/TimesheetMutation.cs` (UpdateMultipleTimesheets, DeleteTimesheet, Add/Update/Delete Task, Project, Employee, Add/Update TimeOff, GenerateTimesheetPdf), `Querys/TimesheetQuery.cs`, `Myb.Timesheet.Services/*` (TimesheetService, PdfService, EmployeeService, ProjectService, TaskService, TimeoffService). Front : `libs/time-sheet-module` (timesheet-*, project-*, task-*, employee-*, timeoff-list, period-selector, intervenant-timesheet).
**Enums** : Status (feuille) Submitted / Approved / Rejected ; ApprovalStatus (congé) Pending / Approved / Rejected ; TimeOffType Vacation / Sick / Personal ; ProjectStatus Active / Completed / Archived / Deleted.
**Tests existants** : `unit-tests/timesheet-management/` + 39 specs dans `libs/time-sheet-module`.

## TS-PJ — Projets, tâches, employés

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| TS-PJ-001 | CRUD projet ; `GetActiveProjects` / `GetArchivedProjects` | U,I,E | P2 | manager | Filtrage correct par statut |
| TS-PJ-002 | Archiver un projet qui a des feuilles de temps | I | P2 | manager | Les feuilles restent ; aucune nouvelle saisie possible sur ce projet |
| TS-PJ-003 | CRUD tâche ; `GetTasksByProjectId` | U,I | P2 | manager | OK |
| TS-PJ-004 | CRUD employé ; `GetEmployeesByManagerId` | U,I | P2 | manager | Uniquement ses employés |
| TS-PJ-005 | `GetManagerIdByUserId` pour un utilisateur qui n'est pas manager | U | P3 | — | `null`, aucune exception |

## TS-TS — Saisie et validation

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| TS-TS-001 | Saisir une semaine sur 2 projets (`UpdateMultipleTimesheets`) | U,I,E | P1 | employé | Lignes créées ou mises à jour en lot ; totaux par jour et par semaine exacts |
| TS-TS-002 | Saisie avec des champs obligatoires manquants | U | P2 | employé | « Required information is missing for adding a new timesheet… » |
| TS-TS-003 | Plus de 24 h dans une journée, ou heures négatives | U,E | P2 | employé | Rejeté (`timesheet-quantity-input`) |
| TS-TS-004 | Soumettre, puis le manager approuve ou rejette | I,E | P1 | employé+manager | Statut `Submitted` → `Approved`/`Rejected` ; feuille non modifiable une fois approuvée |
| TS-TS-005 | Un manager approuve la feuille d'un employé qui n'est pas le sien | I | P1 | manager | Refus |
| TS-TS-006 | `GetTimesheetsByUserId` pour un autre utilisateur | I | P1 | employé | Refus |
| TS-TS-007 | Changement de période (`period-selector`) : semaine, mois | U,E | P3 | employé | Données rechargées pour la période |
| TS-TS-008 | `GenerateTimesheetPdf` | U,I | P2 | manager | PDF valide (signature `%PDF-`), contenu égal aux données ; rendu visuel de référence |
| TS-TS-009 | Saisie de l'intervenant (`intervenant-timesheet`) | E,V | P3 | intervenant | Capture et parcours |

## TS-TO — Congés

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| TS-TO-001 | Demander un congé (`Vacation`/`Sick`/`Personal`) | U,I,E | P2 | employé | Statut `Pending` |
| TS-TO-002 | Date de fin antérieure à la date de début, ou chevauchement avec un congé existant | U | P2 | employé | Refus |
| TS-TO-003 | Le manager approuve ou rejette | I | P2 | manager | Statut mis à jour ; les jours approuvés sont bloqués dans la saisie des heures |
