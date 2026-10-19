# Authentification, rôles et contrôle d'accès

**Périmètre** : connexion Keycloak, mapping JWT → rôles, guards Angular, isolation entre copropriétés côté API.
**Sources** : `libs/auth`, `apps/admin/src/app/app.routes.ts` (roleLandingGuard), `libs/coproperty-module/.../coproperty.routes.ts` (authGuard, copropertyContextGuard, profileGuard, legacy*RedirectGuard), `Services/CopropertyAccessControl.cs`, `Services/KeycloakRoleClaimsTransformation.cs` (coproperty et notification).

## AUTH-KC — Keycloak et jeton

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| AUTH-KC-001 | Accès à une route protégée sans session | E | P1 | ANON | Redirection vers la page de connexion Keycloak, puis retour à l'URL demandée |
| AUTH-KC-002 | Connexion valide | E,V | P1 | SYN | Atterrissage sur le tableau de bord syndic ; jeton présent dans les requêtes GraphQL |
| AUTH-KC-003 | Jeton expiré pendant la navigation | E | P1 | OWN | Rafraîchissement silencieux ; la requête GraphQL en cours est rejouée, pas d'erreur visible |
| AUTH-KC-004 | Échec du refresh token | E | P2 | OWN | Retour à la connexion, aucun écran blanc |
| AUTH-KC-005 | Déconnexion | E | P2 | tous | Session Keycloak fermée ; le bouton Retour ne rouvre pas l'espace |
| AUTH-KC-006 | `KeycloakRoleClaimsTransformation` lit `realm_access.roles` et `resource_access.<client>.roles` | U | P1 | — | Chaque rôle devient un `ClaimTypes.Role` ; pas de doublon si le rôle est présent aux deux endroits |
| AUTH-KC-007 | Jeton sans claim `roles` | U | P2 | — | Aucune exception levée, aucun rôle attribué |
| AUTH-KC-008 | ⚠ Requête API sans jeton ou avec une signature invalide | I | P1 | ANON | Attendu : 401 sur GraphQL et sur REST (sauf les endpoints anonymes listés dans `securite.md`). **Risque** : `Myb.Coproperty/Program.cs` accepte volontairement les requêtes anonymes (aucun `[Authorize]` sur les Queries/Mutations). Il faut lancer chaque opération sans jeton pour savoir lesquelles répondent quand même |

## AUTH-NAV — Routage par rôle (frontend)

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| AUTH-NAV-001 | `/` et `/home` après connexion | U,E | P1 | SYN/ADM/SYS | Redirection vers l'espace syndic |
| AUTH-NAV-002 | idem | U,E | P1 | CNS | Redirection vers `/coproperty/council/dashboard` |
| AUTH-NAV-003 | idem | U,E | P1 | CPT | Redirection vers `/coproperty/accountant/dashboard` |
| AUTH-NAV-004 | idem | U,E | P1 | OWN/TEN | Redirection vers l'espace propriétaire de sa copropriété |
| AUTH-NAV-005 | Utilisateur qui a plusieurs rôles (`dual-1`) | E | P2 | dual | Page `choose-space` ; les deux espaces sont accessibles |
| AUTH-NAV-006 | Propriétaire qui ouvre `/coproperty/:id/syndic/...` | E | P1 | OWN | Page `access-denied` |
| AUTH-NAV-007 | Comptable qui ouvre `/coproperty/council` | E | P2 | CPT | Page `access-denied` |
| AUTH-NAV-008 | `copropertyContextGuard` avec l'id d'une copropriété non assignée | U,E | P1 | SYN | Refus ou redirection vers `/coproperty/select` |
| AUTH-NAV-009 | `profileGuard` : propriétaire au profil incomplet | U,E | P2 | OWN | Redirection vers `register/complete-profile` |
| AUTH-NAV-010 | Anciennes URL `/coproperty/syndic/**` et `/coproperty/owner/**` | U | P3 | SYN/OWN | Redirection vers `/coproperty/:copropertyId/...` |
| AUTH-NAV-011 | Une seule copropriété accessible | E | P3 | OWN | `/coproperty` envoie directement dans cette copropriété, sans passer par l'écran de sélection |
| AUTH-NAV-012 | Route inconnue (`**`) | E,V | P3 | tous | Page 404 ou redirection prévue |
| AUTH-NAV-013 | Menu latéral filtré selon le rôle | V | P2 | chaque rôle | Une capture par rôle ; aucune entrée interdite affichée |

## AUTH-ACL — Isolation côté API (`CopropertyAccessControl`)

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| AUTH-ACL-001 | `IsAdmin` / `IsOwner` / `IsSyndicOnly` selon les combinaisons de rôles | U | P1 | — | Table de vérité : syndic seul → SyndicOnly ; syndic + admin → pas SyndicOnly |
| AUTH-ACL-002 | `ResolveEffectiveManagerId` : un syndic demande le managerId d'un autre syndic | U | P1 | SYN | Refus « vous ne pouvez consulter que vos propres copropriétés » |
| AUTH-ACL-003 | `ResolveEffectiveManagerId` appelé par un admin avec n'importe quel managerId | U | P1 | ADM | managerId demandé accepté |
| AUTH-ACL-004 | `ResolveManagerIdForWrite` : un syndic écrit pour un autre syndic | U | P1 | SYN | Refus « vous ne pouvez gérer que vos propres copropriétés » |
| AUTH-ACL-005 | `EnsureOwnership` sur une copropriété d'un autre syndic | U,I | P1 | SYN | Refus « cette copropriété ne vous est pas assignée » |
| AUTH-ACL-006 | Jeton sans `sub` ou `sub` qui n'est pas un GUID | U | P1 | — | « Impossible d'identifier l'utilisateur authentifié » |
| AUTH-ACL-007 | `GetScopedCopropertyIdsAsync` : admin → `null` (aucune restriction) ; syndic → uniquement ses copropriétés | U,I | P1 | ADM/SYN | Ensemble attendu |
| AUTH-ACL-008 | IDOR : `syn-a` lit ou modifie des entités de COPRO-B (lots, propriétaires, appels de fonds, charges, interventions, signalements, discussions) par leur id | I | P1 | SYN | Toutes les requêtes sont refusées. Faire une table entité × opération et la vérifier en entier |
| AUTH-ACL-009 | IDOR : `own-1` lit les factures, appels de fonds ou justificatifs de `own-2` | I | P1 | OWN | Refus |
| AUTH-ACL-010 | `IsSelfOwner` : un syndic-propriétaire lit son propre profil propriétaire | U | P2 | dual | Autorisé ; refusé pour un autre userId |
| AUTH-ACL-011 | Mutations réservées au syndic (création de copropriété, rôles client, etc.) appelées par un propriétaire | I | P1 | OWN | Refus. Liste des mutations à dériver du schéma GraphQL |
