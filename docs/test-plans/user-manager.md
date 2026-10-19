# Gestion des utilisateurs (user-manager)

**Sources** : `Myb.UserManager.Infra/GraphQl/Mutations/UserMutation.cs` (AddUser, UpdateUser, DeleteUser), `Querys/UserQuery.cs` (GetUsers, GetUser, GetUserById, GetUserByIds, GetMessage, GetMe, GetWelcome, GetAuthorized, GetToken), `Myb.UserManager.Sevices/UserService.cs`, `Myb.UserManager.Client` (client GraphQL HTTP), `common/Myb.common.IdentityProvider`. Front : `libs/shared` (userCRUD, profile-page). E2E existant : `src/tests/end-2-end-tests/Myb.UserManager.E2e.Tests`.

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| USR-001 | CRUD utilisateur (AddUser, UpdateUser, DeleteUser) | U,I,E | P2 | SYS | OK ; synchronisation avec Keycloak si elle est prévue |
| USR-002 | AddUser avec un e-mail ou un username déjà utilisé | U,I | P2 | SYS | Refus |
| USR-003 | Mutations utilisateur appelées par un rôle non admin | I | P1 | OWN | Refus |
| USR-004 | `GetMe` | I | P2 | tous | Profil de l'appelant uniquement |
| USR-005 | `GetUsers` / `GetUserById` / `GetUserByIds` sans jeton | I | P1 | ANON | Refus attendu (pas d'`[Authorize]` visible sur ces champs) |
| USR-006 | ⚠ `GetToken` (échange identifiant / mot de passe → jeton Keycloak), accessible anonymement | I | P1 | ANON | Vérifier : limitation de débit, aucun secret client exposé, erreurs génériques. Envisager de le supprimer si plus aucun client ne l'utilise |
| USR-007 | ⚠ Champs de démonstration `GetUser` (« Koutaiba »), `GetWelcome`, `GetMessage`, `GetAuthorized` (renvoie tous les claims du jeton) | I | P2 | — | Code de démonstration exposé en Production : vérifier qu'il est retiré ou protégé |
| USR-008 | `GraphQlHttpClient` : timeout, réponse avec un tableau `errors`, 401 | U | P2 | — | Exceptions typées et messages clairs |
| USR-009 | Écran de gestion des utilisateurs (userCRUD) | E,V | P3 | SYS | Capture et parcours |
