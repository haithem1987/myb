# i18n, RTL et UI commune

**Sources** : `libs/shared` (language-switcher, toasts-container, loader, no-result, error-alert, modal-container, notification-dropdown, user-dropdown, layouts), mutation `SyncPreferredLanguage`, `docs/i18n-arabic-rtl-plan.md`.

## UI-I18N — Langues

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| UI-I18N-001 | Changer de langue fr → en → ar | E,V | P2 | tous | Textes traduits ; aucune clé brute (`COPROPERTY.X.Y`) visible |
| UI-I18N-002 | Arabe | V | P2 | tous | `dir="rtl"` sur la page ; menu, icônes et tableaux en miroir |
| UI-I18N-003 | Langue choisie → `SyncPreferredLanguage` | I,E | P3 | tous | Préférence enregistrée dans Keycloak et retrouvée à la reconnexion |
| UI-I18N-004 | Toutes les clés présentes dans les 3 fichiers de traduction | U | P2 | — | Script qui compare les clés fr/en/ar ; aucune clé manquante |
| UI-I18N-005 | Formats de montants et de dates selon la langue et la devise (TND à 3 décimales, EUR à 2) | U | P1 | — | Pipe ou fonction de formatage testé par devise |

## UI-CMN — Composants communs

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| UI-CMN-001 | Toasts succès, erreur et info (API `ToastService`) | U,V | P3 | — | Affichage, disparition automatique, empilement |
| UI-CMN-002 | Erreur GraphQL métier (message FR du backend) | E | P2 | — | Message lisible affiché dans le toast ou dans l'alerte, jamais `[object Object]` |
| UI-CMN-003 | Liste vide | V | P3 | — | Composant `no-result` affiché |
| UI-CMN-004 | Chargement lent | V | P3 | — | Loader affiché, pas de flash de contenu vide |
| UI-CMN-005 | Modale de confirmation (suppression, annulation) | U,E | P2 | — | Annuler n'appelle aucune mutation |
| UI-CMN-006 | Mise en page mobile (390 px) des layouts syndic et propriétaire | V | P2 | SYN/OWN | Menu replié, aucun défilement horizontal |
| UI-CMN-007 | Pages publiques (accueil, contact, CGU, confidentialité, docs) | V | P3 | ANON | Captures de référence |
| UI-CMN-008 | Accessibilité de base : focus visible, labels de formulaires, contrastes | E | P2 | — | Audit axe sans violation critique sur les pages principales |
