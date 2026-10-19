# Campagnes et historique de communication

**Sources** : `CommunicationController` (`/api/communication` : logs, logs/{id}, stats, campaigns, campaigns/{id}, POST campaigns, `{id}/start`, `{id}/cancel`, `{id}/logs`), `CampaignService`, `CommunicationLogService`. Front : `apps/admin` (communication-hub, communication-campaigns, communication-history).
**Tests existants** : `unit-tests/notification/Communication/`.
**Statuts de campagne** : Draft, Scheduled, Running, Completed, Cancelled, Failed. **Canaux** : InApp, e-mail, push, WhatsApp.

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| NOT-CM-001 | Créer une campagne (canaux, destinataires, contenu) | U,I,E | P2 | SYN | Statut `Draft` ou `Scheduled` |
| NOT-CM-002 | Campagne sans destinataire | U | P2 | SYN | « At least one recipient is required. » |
| NOT-CM-003 | Démarrer une campagne | U,I | P2 | SYN | Statut `Running` puis `Completed` ; un `CommunicationLog` par destinataire et par canal |
| NOT-CM-004 | Démarrer une campagne déjà `Completed` ou `Cancelled` | U | P2 | SYN | Refusé |
| NOT-CM-005 | Annuler une campagne en cours | U,I | P2 | SYN | Statut `Cancelled` ; plus aucun envoi ensuite |
| NOT-CM-006 | Démarrer ou annuler une campagne inexistante | U | P3 | SYN | « Campaign not found. » |
| NOT-CM-007 | Un canal échoue (WhatsApp KO) pendant que les autres réussissent | U | P2 | — | Les autres canaux sont envoyés ; seul le canal en erreur est en échec dans les logs |
| NOT-CM-008 | Destinataires d'une autre copropriété | I | P1 | SYN | Refus |
| NOT-CM-009 | Logs et stats limités au périmètre du syndic | I | P1 | SYN | Aucune donnée de COPRO-B |
| NOT-CM-010 | Stats : envoyés, livrés, lus, échecs par canal | U | P3 | SYN | Agrégats égaux à la fixture |
| NOT-CM-011 | Écrans hub, campagnes et historique (filtres, détail d'un log) | E,V | P3 | SYN | Captures |
| NOT-CM-012 | Accès d'un propriétaire à `/api/communication/*` | I | P1 | OWN | 403 |
