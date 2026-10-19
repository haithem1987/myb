# Plans de test MYB

Plans de test répétables, module par module. Chaque scénario a un identifiant stable : on s'en sert pour générer plus tard les tests unitaires, d'intégration, E2E et visuels, et pour suivre la couverture.

> Pour l'instant, ce dossier ne contient que les **plans**. Aucun test n'est encore implémenté à partir de ces fiches.

## Arborescence

```
docs/test-plans/
├── README.md                          ← conventions (ce fichier)
├── 00-transverse/
│   ├── auth-roles-acces.md            ← Keycloak, guards Angular, CopropertyAccessControl, multi-copro
│   ├── securite.md                    ← upload, détection de menaces, webhooks, IDOR
│   └── i18n-ui-commune.md             ← langues/RTL, layouts, toasts, états vides/erreur
├── coproperty/                        ← service Myb.Coproperty + lib coproperty-module
│   ├── 01-coproprietes.md
│   ├── 02-lots-proprietaires-locataires.md
│   ├── 03-budgets-charges-repartition.md
│   ├── 04-appels-de-fonds.md
│   ├── 05-finance-factures-tresorerie.md
│   ├── 06-maintenance-interventions.md
│   ├── 07-signalements.md
│   ├── 08-assemblees-generales.md
│   ├── 09-discussions.md
│   ├── 10-dashboards-rapports.md
│   └── 11-espace-proprietaire.md      ← inscription, activation, profil, portail
├── payment/
│   ├── rapprochement-bancaire.md
│   └── stripe-abonnements.md
├── notification/
│   ├── notifications-temps-reel-push.md
│   ├── whatsapp.md
│   └── campagnes-communication.md
├── mailer.md
├── document-management.md
├── invoice-management.md
├── timesheet.md
└── user-manager.md
```

## Format d'un scénario

Chaque fiche commence par un en-tête (périmètre, sources dans le code, données de référence), puis liste les scénarios dans des tableaux :

| Colonne | Contenu |
|---|---|
| **ID** | `<MODULE>-<FONCTION>-<NNN>` (exemple : `COP-FC-012`). Un ID ne change jamais. On ne réutilise pas l'ID d'un scénario supprimé. |
| **Scénario** | Action + condition, formulée sur une ligne. |
| **Niv.** | `U` unitaire · `I` intégration (API + base) · `E` E2E navigateur · `V` visuel (capture d'écran de référence). Un scénario peut porter plusieurs niveaux. |
| **P** | `P1` bloquant (argent, sécurité, perte de données) · `P2` fonctionnel majeur · `P3` confort. |
| **Rôle** | Rôle Keycloak qui exécute : `SYN` syndic · `ADM` coproperty-admin · `SYS` system-admin · `OWN` propriétaire · `TEN` locataire · `CNS` conseil syndical · `CPT` comptable · `ANON` · `SVC` appel interne entre services. |
| **Attendu** | Résultat observable et vérifiable : valeur, statut, message, code HTTP. |

Le marqueur **⚠** signale un risque repéré en lisant le code (bug probable ou garde-fou absent). Le premier test écrit sur ce point doit d'abord le confirmer, avant toute correction.

## Correspondance niveau → emplacement des futurs tests

| Niv. | Backend (.NET 8, xUnit) | Frontend (Angular 17, Nx) |
|---|---|---|
| U | `src/tests/unit-tests/<service>/` (projets existants) | `libs/<lib>/**/*.spec.ts` (Jest) |
| I | `src/tests/integration-tests/<service>/` (à créer : `WebApplicationFactory` + PostgreSQL de test, Keycloak bouchonné par JWT signé) | — |
| E | — | `apps/admin-e2e/src/e2e/<module>/` (Cypress, déjà configuré) |
| V | — | Captures de référence par page × rôle × langue (fr/en/ar-RTL) × largeur (1440/390) |

## Jeux de données de référence (fixtures communes)

Tous les plans réutilisent les mêmes données, pour qu'un scénario soit rejouable à l'identique :

- **COPRO-A** : active, devise TND, 4 lots (A101 100 tantièmes / 80 m², A102 200 / 120 m², B201 300 / 0 m², B202 400 / 150 m²), syndic `syn-a`.
- **COPRO-B** : active, devise EUR, gérée par un autre syndic `syn-b` (sert aux tests d'isolation).
- **COPRO-INACTIVE** : inactive (sert à vérifier le blocage des nouvelles opérations).
- **Utilisateurs** : `own-1` (propriétaire de A101 + A102), `own-2` (B201), `ten-1` (locataire de A101), `dual-1` (syndic + propriétaire), `cns-1`, `cpt-1`, `adm-1`, `sys-1`.
- Date de référence figée pour les tests sensibles au temps (échéances, délai de grâce de 30 jours, relances).

## Ordre de mise en œuvre conseillé

1. Les `P1` de niveau `U`/`I` sur l'argent : appels de fonds, répartition, paiements, rapprochement bancaire.
2. Les `P1` de sécurité et d'isolation entre copropriétés.
3. Les parcours `E` critiques : syndic qui crée un budget → appel de fonds → paiement du propriétaire → validation.
4. Les captures `V` des pages principales.
5. Les `P2`/`P3` restants.
