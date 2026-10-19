# Lots, propriétaires, locataires

**Sources** : `UnitMutations`/`UnitQueries`, `UnitService` ; `OwnerMutations` (CreateOwnerWithUnits, UpdateOwnerWithUnits, ChangeUnitOwner, AddOwner, RemoveOwner), `OwnerQueries`, `OwnerService`, `OwnerUnitRepository` ; `CopropertyMutations.CreateOwnerUserAccount`, `CopropertyQueries.SearchOwnerCandidates` ; `TenantMutations`/`TenantQueries`, `TenantService`. Front : `units-list`, `unit-management`, `owner-management`, `tenant-management`.

## COP-UN — Lots

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-UN-001 | Créer un lot (numéro, type, tantièmes, surface, étage) | U,I,E | P1 | SYN | Lot créé, présent dans `GetUnits(copropertyId)` |
| COP-UN-002 | Numéro de lot déjà utilisé dans la même copropriété | U,I | P2 | SYN | « A unit with this number already exists in this coproperty. » |
| COP-UN-003 | Même numéro dans une autre copropriété | U | P3 | SYN | Accepté |
| COP-UN-004 | La somme des tantièmes des lots dépasserait le total de la copropriété (à la création et à la modification) | U,I | P1 | SYN | « Total unit shares cannot exceed coproperty total shares (N). » |
| COP-UN-005 | Somme des tantièmes exactement égale au total | U | P2 | SYN | Accepté (cas limite) |
| COP-UN-006 | Tantièmes négatifs ou surface négative | U,E | P2 | SYN | Rejeté |
| COP-UN-007 | Supprimer un lot qui a un propriétaire | U,I | P1 | SYN | « Cannot delete unit '…' because it is associated with one or more owners… » |
| COP-UN-008 | Supprimer un lot libre | I | P3 | SYN | Supprimé |
| COP-UN-009 | Créer ou modifier un lot dans COPRO-INACTIVE | U,I | P1 | SYN | « New operations are not allowed for an inactive coproperty. » |
| COP-UN-010 | `GetAllUnitsBySyndic` | I | P2 | SYN | Lots de toutes ses copropriétés, aucun de COPRO-B |
| COP-UN-011 | `GetUnitsByOwner` | I | P2 | OWN | Uniquement ses lots |
| COP-UN-012 | Liste des lots : tri, filtre, recherche, pagination | E,V | P3 | SYN | Capture et comportement attendus |

## COP-OW — Propriétaires

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-OW-001 | `CreateOwnerWithUnits` avec 2 lots | U,I,E | P1 | SYN | Propriétaire et liens `OwnerUnit` créés dans une même transaction |
| COP-OW-002 | Création avec un lot d'une autre copropriété | I | P1 | SYN | Refus, aucune écriture partielle |
| COP-OW-003 | Échec au milieu de la création (un lot invalide) | I | P1 | SYN | Rollback : ni propriétaire ni lien créé |
| COP-OW-004 | `UpdateOwnerWithUnits` : ajouter ou retirer des lots | I | P2 | SYN | Liens synchronisés ; l'historique des appels de fonds est conservé |
| COP-OW-005 | `ChangeUnitOwner` (vente d'un lot) | I,E | P1 | SYN | Nouveau propriétaire lié ; les appels de fonds déjà émis restent à l'ancien ; les suivants vont au nouveau |
| COP-OW-006 | `RemoveOwner` avec des appels de fonds impayés | I | P1 | SYN | Refusé, ou soldes conservés (règle à confirmer) |
| COP-OW-007 | Modifier ou supprimer un propriétaire de COPRO-INACTIVE | U,I | P1 | SYN | « Les propriétaires d'une copropriété inactive sont en lecture seule. » |
| COP-OW-008 | `SearchOwnerCandidates` : recherche d'un compte Keycloak existant | I | P3 | SYN | Résultats filtrés ; aucune donnée sensible exposée |
| COP-OW-009 | `CreateOwnerUserAccount` | I | P1 | SYN | Compte Keycloak créé avec le rôle `coproperty-owner` ; e-mail d'activation publié (voir MAIL-*) ; `userId` lié au propriétaire |
| COP-OW-010 | `CreateOwnerUserAccount` avec un e-mail déjà présent dans Keycloak | I | P2 | SYN | Rattachement au compte existant ou erreur claire ; aucun doublon |
| COP-OW-011 | E-mail invalide ou téléphone mal formé | U,E | P2 | SYN | Validation du formulaire et du backend |
| COP-OW-012 | `GetOwnersByUnit` / `GetOwnerByUserId` | I | P2 | SYN/OWN | Résultats limités au périmètre de l'appelant |
| COP-OW-013 | Écran de gestion des propriétaires (liste, modale de création, choix des lots) | E,V | P2 | SYN | Capture et parcours complet |

## COP-TN — Locataires

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-TN-001 | Créer un locataire sur A101 | U,I,E | P2 | SYN | Locataire actif |
| COP-TN-002 | Deuxième locataire actif sur le même lot | U,I | P2 | SYN | « This unit already has an active tenant » |
| COP-TN-003 | Nouveau locataire après la fin du bail du précédent | U | P2 | SYN | Accepté |
| COP-TN-004 | Date de fin antérieure ou égale à la date de début | U,E | P2 | SYN | « La date de fin doit être postérieure à la date de début. » |
| COP-TN-005 | Création dans COPRO-INACTIVE | U | P2 | SYN | Refus « inactive coproperty » |
| COP-TN-006 | `RemoveTenant` | I | P3 | SYN | Locataire retiré ; le lot accepte un nouveau locataire |
| COP-TN-007 | Accès du locataire (`ten-1`) à l'espace propriétaire | E | P2 | TEN | Accès en lecture limité à son lot ; aucune donnée financière du propriétaire |
