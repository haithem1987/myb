# Copropriétés

**Sources** : `CopropertyMutations` (Create/Update/Delete, AssignUserClientRole, UnassignUserClientRole), `CopropertyQueries` (GetCoproperties, GetCopropertyById, GetCopropertiesByManager, GetCopropertyByName, GetManagers, SearchKeycloakUsers, GetUserClientRoles, GetSyndicMenuCounts), `CopropertyService`, `KeycloakAdminService`. Front : `coproperty-list`, `coproperty-new`, `coproperty-detail`, `coproperty-select`, `coproperty-management-layout`, `manager-select`, `manager-multi-select`.

## COP-CP — Gestion des copropriétés

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-CP-001 | Créer une copropriété valide (nom, adresse, devise, tantièmes totaux) | U,I,E | P1 | SYN | Copropriété créée avec `managerId` = syndic connecté ; visible dans `/coproperty/manage` |
| COP-CP-002 | Créer une copropriété avec un nom déjà utilisé par le même syndic | U,I | P2 | SYN | « A coproperty with this name already exists for this syndic. » |
| COP-CP-003 | Même nom chez un autre syndic | U,I | P3 | SYN | Création acceptée |
| COP-CP-004 | Créer une copropriété pour un autre syndic (managerId forcé) | I | P1 | SYN | Refus (voir AUTH-ACL-004) |
| COP-CP-005 | Un admin crée une copropriété et lui assigne un syndic | I,E | P2 | ADM | `managerId` = syndic choisi |
| COP-CP-006 | Champs obligatoires vides ou devise invalide | U,E | P2 | SYN | Validation du formulaire ; aucune mutation envoyée |
| COP-CP-007 | Modifier les infos (nom, adresse, devise) | I,E | P2 | SYN | Changements persistés ; devise appliquée aux **nouvelles** opérations, `CurrencySnapshot` des anciennes inchangé |
| COP-CP-008 | Réduire les tantièmes totaux sous la somme des tantièmes des lots | U,I | P1 | SYN | Refus, ou comportement défini à documenter |
| COP-CP-009 | Désactiver une copropriété | I,E | P1 | SYN | Statut inactif ; lecture seule partout (voir les tests « copropriété inactive » de chaque fiche) |
| COP-CP-010 | Supprimer une copropriété qui a des lots, appels de fonds ou paiements | I | P1 | SYN | Refusé ou suppression logique, sans perte de données financières |
| COP-CP-011 | Supprimer une copropriété vide | I | P3 | SYN | Supprimée |
| COP-CP-012 | `GetCoproperties` pour un syndic | I | P1 | SYN | Uniquement ses copropriétés |
| COP-CP-013 | `GetCoproperties` pour un admin | I | P2 | ADM | Toutes les copropriétés |
| COP-CP-014 | `GetCopropertyByName` / `GetCopropertyById` sur une copropriété d'un autre syndic | I | P1 | SYN | Refus |
| COP-CP-015 | `GetSyndicMenuCounts` | U,I | P3 | SYN | Compteurs du menu (signalements, interventions, discussions…) égaux aux données de la fixture |
| COP-CP-016 | Écran de sélection avec plusieurs copropriétés | E,V | P2 | SYN | Cartes listées ; un clic ouvre `/coproperty/:id/syndic/dashboard` |
| COP-CP-017 | Page détail d'une copropriété | V | P3 | SYN | Capture de référence |

## COP-KC — Rôles client Keycloak

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-KC-001 | `AssignUserClientRole` (council, accountant) | I | P2 | SYN | Rôle visible dans `GetUserClientRoles` ; l'utilisateur atteint l'espace correspondant |
| COP-KC-002 | `UnassignUserClientRole` | I | P2 | SYN | Rôle retiré ; l'espace devient inaccessible au prochain jeton |
| COP-KC-003 | Attribuer `system-admin` ou un rôle hors liste blanche | I | P1 | SYN | Refusé |
| COP-KC-004 | Keycloak indisponible pendant l'attribution | U | P2 | SYN | Erreur claire, aucun état partiel |
| COP-KC-005 | `SearchKeycloakUsers` / `GetManagers` | I | P3 | ADM | Recherche par e-mail ou nom ; pagination bornée |
