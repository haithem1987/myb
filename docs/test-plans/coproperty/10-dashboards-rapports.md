# Tableaux de bord et réglages

**Sources** : `CopropertyQueries.GetDashboardStats`, `GetSyndicMenuCounts`, `GetTreasuryDashboard` ; front `syndic-dashboard`, `dashboard`, `owner-dashboard`, `reports`, `syndic-settings`, layouts `syndic-layout`, `owner-layout`, `accountant-layout`, `council-layout`.

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-DB-001 | `GetDashboardStats` sur la fixture | U,I | P1 | SYN | Nombre de lots, de propriétaires, d'impayés, de signalements ouverts et d'interventions en cours égal aux valeurs calculées |
| COP-DB-002 | `GetDashboardStats` sur une copropriété vide | U | P2 | SYN | Tout à 0, aucune exception |
| COP-DB-003 | Tableau de bord syndic | E,V | P1 | SYN | Cartes KPI, graphique de trésorerie, dernières activités ; capture fr/en/ar, 1440/390 |
| COP-DB-004 | Le tableau de bord se met à jour après une action (versement validé) | E | P2 | SYN | KPI rafraîchis sans recharger la page (temps réel si SignalR est branché) |
| COP-DB-005 | Tableau de bord du conseil syndical (lecture seule) | E,V | P2 | CNS | Aucun bouton de création ou de modification |
| COP-DB-006 | Tableau de bord du comptable | E,V | P2 | CPT | Accès aux données financières ; aucun accès à la gestion des lots ou propriétaires |
| COP-DB-007 | Tableau de bord propriétaire | E,V | P1 | OWN | Ses lots, son solde dû, ses prochaines échéances et AG |
| COP-DB-008 | Compteurs du menu syndic | I,V | P3 | SYN | Badges égaux à `GetSyndicMenuCounts` |
| COP-ST-001 | Page réglages syndic (copropriété, WhatsApp, préférences) | E,V | P3 | SYN | Enregistrement OK ; voir NOT-WA-* pour la configuration WhatsApp |
