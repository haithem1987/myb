# Maintenance et interventions

**Sources** : `MaintenanceMutations` (Create/UpdateWithDates, Create/Update, AssignMaintenance, UpdateMaintenanceStatus, CompleteMaintenance, DeleteMaintenanceRequest), `MaintenanceQueries` (GetMaintenanceRequests, ById, GetMyMaintenanceRequests), `MaintenanceService` ; `InterventionMutations` (Create, Update, Delete, UpdateInterventionStatus, AssignIntervention, CompleteIntervention), `InterventionQueries`, `InterventionService`. Front : `maintenance-list`, `maintenance-requests`, `new-maintenance-request-dialog`, `maintenance`, `intervention-list`, `intervention-new`, `intervention-management`.
**Statuts maintenance** : Pending, Assigned, InProgress, Completed, Cancelled. **Statuts intervention** : Draft, Planned, InProgress, Completed, Cancelled, Invoiced.

## COP-MT — Demandes de maintenance

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-MT-001 | Le propriétaire crée une demande (catégorie, priorité, lot, description) | U,I,E | P2 | OWN | Statut `Pending` ; syndic notifié ; visible dans `GetMyMaintenanceRequests` |
| COP-MT-002 | Demande sur un lot qui ne lui appartient pas | I | P1 | OWN | Refus |
| COP-MT-003 | Le syndic assigne un prestataire | I,E | P2 | SYN | `Assigned` ; propriétaire notifié |
| COP-MT-004 | `UpdateMaintenanceStatus` → `InProgress` → `CompleteMaintenance` | U,I | P2 | SYN | Dates de début et de fin renseignées ; statut final `Completed` |
| COP-MT-005 | Modifier ou supprimer une demande dans COPRO-INACTIVE | U | P1 | SYN | « Les interventions d'une copropriété inactive sont en lecture seule. » |
| COP-MT-006 | Transitions interdites (`Completed`→`Pending`, `Cancelled`→`InProgress`) | U | P2 | SYN | Règle à définir et à tester. Aujourd'hui aucune garde n'a été repérée |
| COP-MT-007 | Priorité `Emergency` | U,V | P2 | — | Mise en évidence dans la liste ; notification immédiate |
| COP-MT-008 | Supprimer la demande d'un autre propriétaire | I | P1 | OWN | Refus |
| COP-MT-009 | Listes côté syndic et propriétaire (filtres par statut et catégorie) | E,V | P3 | SYN/OWN | Captures |

## COP-IV — Interventions

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-IV-001 | Créer une intervention (type parmi les 17, prestataire, coût estimé, date) | U,I,E | P2 | SYN | Statut initial `Draft` ou `Planned` |
| COP-IV-002 | Créer une intervention dans COPRO-INACTIVE | U | P1 | SYN | Refus « inactive coproperty » |
| COP-IV-003 | `AssignIntervention` | U | P2 | SYN | Statut `Planned` |
| COP-IV-004 | `UpdateInterventionStatus(InProgress)` sans date de début | U | P2 | SYN | `StartedDate` renseignée automatiquement, une seule fois |
| COP-IV-005 | `UpdateInterventionStatus(Completed)` / `CompleteIntervention` | U | P2 | SYN | Statut `Completed` + date de fin |
| COP-IV-006 | ⚠ `UpdateInterventionStatus` accepte n'importe quelle transition (`Invoiced`→`Draft`…) | U | P2 | SYN | Matrice des transitions à définir. **Risque** : le statut est affecté sans contrôle |
| COP-IV-007 | Modifier une intervention (`interventions/:id/edit`) | E | P3 | SYN | Formulaire prérempli, modifications enregistrées |
| COP-IV-008 | Supprimer une intervention `Invoiced` | U,I | P1 | SYN | Refusé, ou traçabilité conservée |
| COP-IV-009 | Le propriétaire consulte les interventions de sa copropriété | E | P3 | OWN | Lecture seule, aucun bouton d'action |
| COP-IV-010 | Une intervention d'une autre copropriété par son id | I | P1 | SYN | Refus |
