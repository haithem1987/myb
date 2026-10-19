# Espace propriétaire : inscription, activation, profil, portail

**Sources** : `CopropertyMutations` (ConfirmCurrentUserActivation, ChangeOwnPassword, UpdateMyOwnerPhone, SyncPreferredLanguage), `OwnerMutations` (SynchronizeMyOwnerProfile, UpdateMyOwnerProfile), `OwnershipNotificationService`, `Models/AccountActivationNotification.cs`. Front : `owner-registration`, `registration-path`, `owner-profile-completion`, `owner-portal/*` (my-units, residence, invoices, charges, maintenance, documents, general-assembly, signalements), routes `register`, `complete-profile`, `choose-space`.
**Tests existants** : `unit-tests/coproperty-payment/AccountActivationTests.cs`, `OwnerProfileAccessTests.cs`.

## COP-RG — Inscription et activation

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-RG-001 | Le propriétaire invité clique sur le lien d'activation reçu par e-mail | E | P1 | OWN | Définit son mot de passe dans Keycloak et arrive sur `complete-profile` |
| COP-RG-002 | `ConfirmCurrentUserActivation` | U,I | P1 | OWN | Compte marqué actif ; mutation idempotente si on la rappelle |
| COP-RG-003 | Lien d'activation expiré ou déjà utilisé | E | P2 | ANON | Message clair et possibilité de renvoyer le lien |
| COP-RG-004 | Inscription libre (`/register`) sans profil (`noProfileGuard`) | E | P2 | OWN | Choix du parcours (`registration-path`) |
| COP-RG-005 | Utilisateur qui a déjà un profil et ouvre `/register` | E | P3 | OWN | Redirection vers son espace |
| COP-RG-006 | Complétion du profil : téléphone obligatoire, langue | E,V | P2 | OWN | `UpdateMyOwnerProfile` appelé ; `profileGuard` laisse ensuite passer |

## COP-PF — Profil

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-PF-001 | `UpdateMyOwnerProfile` sans jeton | U,I | P1 | ANON | « Authentification requise. » |
| COP-PF-002 | Téléphone de plus de 50 caractères | U | P2 | OWN | « Le téléphone ne doit pas dépasser 50 caractères. » |
| COP-PF-003 | `UpdateMyOwnerPhone` : le propriétaire ne modifie que son propre profil | I | P1 | OWN | Le profil d'un autre propriétaire n'est pas touché |
| COP-PF-004 | `SynchronizeMyOwnerProfile` sans profil propriétaire | U | P2 | OWN | « Profil propriétaire introuvable. » |
| COP-PF-005 | `SynchronizeMyOwnerProfile` : nom et e-mail Keycloak → profil MYB | I | P2 | OWN | Champs synchronisés |
| COP-PF-006 | `ChangeOwnPassword` : ancien mot de passe faux, nouveau trop faible, puis valide | I,E | P1 | OWN | Erreurs claires ; succès → mot de passe changé dans Keycloak |
| COP-PF-007 | Page profil commune (`/profile`) | V | P3 | tous | Capture |

## COP-PO — Portail propriétaire

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-PO-001 | Mes lots : A101 + A102 avec leurs tantièmes | E,V | P2 | OWN | Uniquement ses lots |
| COP-PO-002 | Résidence : informations de la copropriété et contacts du syndic | E,V | P3 | OWN | Capture |
| COP-PO-003 | Mes charges et répartitions | E,V | P1 | OWN | Montants égaux à COP-DS-001 |
| COP-PO-004 | Mes factures et appels de fonds, puis déclaration d'un versement | E | P1 | OWN | Voir COP-FP-001 |
| COP-PO-005 | Documents de la copropriété | E | P3 | OWN | Liste et téléchargement (voir DOC-*) |
| COP-PO-006 | Propriétaire de lots dans deux copropriétés | E | P2 | OWN | Passage d'une copropriété à l'autre ; aucune donnée mélangée |
| COP-PO-007 | Locataire connecté | E | P2 | TEN | Menus financiers masqués ou en lecture seule (règle à confirmer) |
| COP-PO-008 | Notification de changement de propriétaire (`OwnershipNotificationService`) | U | P2 | — | L'ancien et le nouveau propriétaire sont notifiés avec les bons liens (`NotificationLinks`) |
