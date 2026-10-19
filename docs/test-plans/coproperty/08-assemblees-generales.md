# Assemblées générales

**Sources** : `AssemblyMutations` (Create, Update, Delete, UpdateAssemblyStatus), `AssemblyQueries` (GetAssemblies, GetUpcomingAssemblies, GetAssemblyById), `AssemblyService`, `AssemblyAttendanceType`. Front : `general-assembly` (syndic), `owner-assemblies`, `apps/admin/.../general-assembly`.
**Enums** : type Ordinary / Extraordinary ; statut Scheduled / Completed / Cancelled.

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-AG-001 | Créer une AG ordinaire (date, lieu, ordre du jour) | U,I,E | P2 | SYN | Statut `Scheduled` ; propriétaires convoqués (notification et e-mail) |
| COP-AG-002 | Créer une AG à une date passée | U,E | P2 | SYN | Refus, ou avertissement (règle à définir) |
| COP-AG-003 | Créer, modifier ou supprimer dans COPRO-INACTIVE | U | P1 | SYN | « Les assemblées d'une copropriété inactive sont en lecture seule. » |
| COP-AG-004 | `UpdateAssemblyStatus` → `Completed` puis → `Scheduled` | U | P2 | SYN | Transition retour interdite (règle à confirmer) |
| COP-AG-005 | Annuler une AG | I | P2 | SYN | `Cancelled` ; propriétaires notifiés |
| COP-AG-006 | `GetUpcomingAssemblies` | U | P3 | OWN | Uniquement les AG `Scheduled` à venir, triées par date (horloge figée) |
| COP-AG-007 | Présences et votes (`AssemblyAttendance`) | U,I | P2 | SYN | Feuille de présence ; quorum calculé en tantièmes |
| COP-AG-008 | Le propriétaire consulte les AG de sa copropriété | E,V | P3 | OWN | Lecture seule ; capture |
| COP-AG-009 | Accès à une AG d'une autre copropriété | I | P1 | OWN/SYN | Refus |
