# Appels de fonds

**Sources** : `FundCallMutations` (Create, Update, UpdateFundCallStatus, AddFundCallPayment, DeleteFundCall, CancelFundCall, GenerateInvoicesFromFundCall, ReviewFundCallPayment), `FundCallQueries` (GetFundCall, GetFundCallsByCoproperty, GetAllFundCalls, GetFundCallsByOwner, GetFundCallPaymentsByOwner, GetFundCallPaymentJustificatif, GetCopropertyFundCallOverdueTotal, GetExistingFundCallTotals), `FundCallService`, `FundCallReminderService`, `Controllers/InternalFundCallController`. Front : `fund-calls-list`, `fund-call-new`, `cancel-fund-call-modal`, `delete-fund-call-modal`, `charge-payments`, `invoice-payment-dialog`.
**Tests existants** : `unit-tests/coproperty-payment/FundCallPaymentProofTests.cs`, `RequestedFixesTests.cs`, `unit-tests/payment/FundCallIntegrationTests.cs`.
**Statuts** : `ToPay` → `PendingValidation` → `Paid` / `Validated`, et `Cancelled`.

## COP-FC — Cycle de vie

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-FC-001 | Créer un appel de fonds pour `own-1` (montant, échéance, description) | U,I,E | P1 | SYN | Statut `ToPay`, `CurrencySnapshot` = TND, propriétaire notifié |
| COP-FC-002 | Créer sans `CopropertyId` | U | P2 | — | « CopropertyId is required to create a fund call » |
| COP-FC-003 | Créer avec une copropriété inexistante | U | P2 | — | « Coproperty with ID … not found » |
| COP-FC-004 | Créer dans COPRO-INACTIVE | U,I | P1 | — | « New operations are not allowed for an inactive coproperty. » |
| COP-FC-005 | Modifier le montant alors que le statut n'est pas `PendingValidation` | U | P1 | SYN | « Le montant d'un appel de fonds ne peut être modifié que lorsqu'il est en attente de validation. » |
| COP-FC-006 | Modifier un appel `Paid` (n'importe quel champ) | U,I | P1 | SYN | Message `PaidFundCallReadOnlyMessage` ; rien n'est modifié |
| COP-FC-007 | Transition `Validated` → `Paid` | U | P1 | SYN | « La transition de statut … n'est pas autorisée. » |
| COP-FC-008 | Matrice complète des transitions (5 × 5 statuts) avec `CanTransitionTo` | U | P1 | — | Seul `Validated→Paid` est interdit aujourd'hui. ⚠ Vérifier que `Cancelled→ToPay` ou `Paid→ToPay` sont bien voulus |
| COP-FC-009 | Rattrapage d'un appel `ToPay` dont l'échéance est passée | U | P2 | — | Il est compté dans `GetCopropertyFundCallOverdueTotal` |

## COP-FC (suite) — Suppression et annulation

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-FC-020 | Supprimer un appel `ToPay` sans versement, créé il y a moins de 30 jours | U,I,E | P2 | SYN | Supprimé |
| COP-FC-021 | Supprimer un appel `Cancelled` | U | P1 | SYN | « Impossible de supprimer un appel de fonds annulé… » |
| COP-FC-022 | Supprimer un appel dont le statut n'est pas `ToPay` | U | P1 | SYN | « …publié ou traité. Utilisez l'annulation à la place. » |
| COP-FC-023 | Supprimer un appel qui a des versements | U | P1 | SYN | « …ayant des versements… » |
| COP-FC-024 | Supprimer un appel qui a des factures | U | P1 | SYN | « …ayant des factures associées… » |
| COP-FC-025 | Supprimer un appel créé il y a 30 jours (limite exacte) et il y a 31 jours | U | P2 | SYN | 30 j : vérifier la borne ; 31 j : « …plus de 30 jours… » (horloge figée) |
| COP-FC-026 | Annuler avec un motif de moins de 10 caractères (ou des espaces) | U,E | P1 | SYN | « Un motif d'annulation d'au moins 10 caractères est obligatoire. » |
| COP-FC-027 | Annuler avec un motif valide | U,I,E | P1 | SYN | Statut `Cancelled`, motif et entrée `FundCallAuditLog` enregistrés, propriétaire notifié |
| COP-FC-028 | Modale de suppression d'un appel non supprimable | E,V | P2 | SYN | Raison affichée (`GetPublishReasons`) ; bouton « Annuler l'appel » proposé à la place |

## COP-FP — Versements et justificatifs

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-FP-001 | Le propriétaire déclare un versement partiel avec justificatif PDF | U,I,E | P1 | OWN | Versement `Pending` ; appel en `PendingValidation` ; syndic notifié |
| COP-FP-002 | Versement de 0 ou négatif | U | P1 | OWN | « Le montant du versement doit être supérieur à 0. » |
| COP-FP-003 | Versement supérieur au reste à payer (en comptant les versements approuvés) | U | P1 | OWN | « Le montant du versement (…) dépasse le reste à payer (…). Montant maximum autorisé : … » au format N3 |
| COP-FP-004 | Appel déjà entièrement approuvé | U | P1 | OWN | « Cet appel de fonds est déjà entièrement réglé. » |
| COP-FP-005 | Le reste est déjà couvert par des versements `Pending` | U | P1 | OWN | « Le solde disponible est déjà couvert par des versements en attente de validation. » |
| COP-FP-006 | Versement sur un appel `Cancelled` ou inactif | U | P1 | OWN | « Impossible d'ajouter un versement à un appel de fonds annulé… » |
| COP-FP-007 | Justificatif d'un format non supporté, de plus de 5 Mo, invalide, ou sans nom/type | U | P1 | OWN | Messages FR exacts (voir SEC-UPL-008) |
| COP-FP-008 | Erreur base de données pendant l'enregistrement | U | P1 | — | « Impossible d'enregistrer le versement… » ; aucun versement fantôme |
| COP-FP-009 | Versement sur l'appel d'un autre propriétaire | I | P1 | OWN | Refus (IDOR) |
| COP-FP-010 | `GetFundCallPaymentJustificatif` par le propriétaire, son syndic, puis un tiers | I | P1 | OWN/SYN/autre | Accès accordé / accordé / refusé |
| COP-FP-011 | Deux versements simultanés qui, ensemble, dépassent le reste | I | P1 | OWN | Un seul est accepté (contrôle de concurrence) |

## COP-FR — Validation par le syndic (`ReviewFundCallPayment`)

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-FR-001 | Approuver un versement partiel | U,I,E | P1 | SYN | Versement `Approved` ; l'appel repasse en `ToPay`, ou reste `PendingValidation` s'il reste un autre versement `Pending` |
| COP-FR-002 | Approuver le dernier versement : total approuvé ≥ montant | U,I | P1 | SYN | Appel `Paid` ; propriétaire notifié |
| COP-FR-003 | Rejeter avec un motif | U,I,E | P1 | SYN | `Rejected` + `RejectionReason` ; statut recalculé ; propriétaire notifié avec le motif |
| COP-FR-004 | ⚠ Rejeter sans motif | U | P2 | SYN | Motif à rendre obligatoire. **Risque** : actuellement accepté sans motif |
| COP-FR-005 | ⚠ Réexaminer un versement déjà `Approved`/`Rejected` (rejeté puis approuvé) | U | P1 | SYN | Doit être refusé ou contrôlé. **Risque** : aucune garde sur le statut courant ; le total approuvé peut dépasser le montant |
| COP-FR-006 | Valider un versement d'un appel `Paid` | U | P1 | SYN | Refus (`EnsureNotPaid`) |
| COP-FR-007 | Un propriétaire valide son propre versement | I | P1 | OWN | Refus |
| COP-FR-008 | Échec de la notification après la validation | U | P2 | — | La validation est quand même enregistrée ; l'erreur est seulement journalisée |

## COP-FX — Factures, relances, interne, consultation

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-FX-001 | `GenerateInvoicesFromFundCall` | I | P2 | SYN | Factures liées à l'appel ; relancer ne crée pas de doublon |
| COP-FX-002 | `FundCallReminderService` : prochaine exécution à J+1 00:00 ; en cas d'erreur, nouvel essai 1 h plus tard | U | P2 | — | Calcul du délai correct (horloge figée) |
| COP-FX-003 | Relance d'un appel en retard ou proche de l'échéance | U | P2 | — | E-mail avec tableau (échéance au format `dd/MM/yyyy`) et `monthsLeft` ≥ 1 |
| COP-FX-004 | Pas de relance pour les appels `Paid`/`Cancelled` ou d'une copropriété inactive | U | P1 | — | Aucun e-mail |
| COP-FX-005 | `POST /internal/fund-calls/{id}/payments/from-bank` (depuis le rapprochement bancaire) | I | P1 | SVC | Versement créé et approuvé ; statut recalculé ; idempotent si on rejoue la même transaction bancaire |
| COP-FX-006 | `GET /internal/fund-calls/active` | I | P2 | SVC | Uniquement les appels payables |
| COP-FX-007 | `GetExistingFundCallTotals` / `GetFundCallsByOwner` / `GetFundCallPaymentsByOwner` | I | P2 | SYN/OWN | Totaux cohérents avec la fixture ; périmètre respecté |
| COP-FX-008 | `GetFundCallsByCoproperty` quand la base est en échec | U | P2 | — | « Impossible de charger les appels de fonds pour cette copropriété… » |
| COP-FX-009 | Liste des appels de fonds (badges de statut, filtres, retard en rouge) | E,V | P2 | SYN | Capture par statut |
| COP-FX-010 | Parcours bout en bout : budget → appel → versement du propriétaire → validation syndic → `Paid` → trésorerie mise à jour | E | P1 | SYN+OWN | Chaque étape est visible dans les deux espaces |
