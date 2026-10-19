# Finance, factures et trésorerie

**Sources** : `FinanceMutations` (GenerateInvoicesFromCharge, RecordPayment, SendPaymentReminder), `InvoiceQueries` (ById, ByUnit, ByCoproperty, Overdue, Unpaid, ByCharge, ByOwner), `CopropertyQueries` (GetTreasuryEvolution, GetFinancialReport, GetTreasuryDashboard, GetUnpaidPaymentsSummary, GetOwnerPaymentSummary), `FinanceService`. Front : `invoices`, `treasury-detail`, `unpaid-payments`, `charge-payments`, `reports`.

## COP-IN — Factures et paiements

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-IN-001 | `GenerateInvoicesFromCharge` | U,I | P1 | SYN | Une facture par lot ou propriétaire, montants égaux à la répartition ; statut `Pending` |
| COP-IN-002 | Générer deux fois depuis la même charge | I | P1 | SYN | Aucun doublon |
| COP-IN-003 | Charge inexistante | U | P2 | — | « Charge with ID … not found » |
| COP-IN-004 | `RecordPayment` partiel | U,I | P1 | SYN | Statut `PartiallyPaid` |
| COP-IN-005 | `RecordPayment` qui atteint exactement le total | U | P1 | SYN | Statut `Paid` |
| COP-IN-006 | ⚠ `RecordPayment` au-delà du total restant | U | P1 | SYN | Attendu : refus. **Risque** : aucune garde dans `FinanceService`, le trop-perçu est accepté |
| COP-IN-007 | `RecordPayment` avec un montant ≤ 0 | U | P1 | SYN | Refus attendu (à vérifier) |
| COP-IN-008 | `RecordPayment` sur une facture inexistante ou `Cancelled` | U | P2 | — | Erreur claire |
| COP-IN-009 | Passage en `Overdue` après l'échéance | U | P2 | — | `GetOverdueInvoices` la renvoie (horloge figée) |
| COP-IN-010 | `SendPaymentReminder` | I | P2 | SYN | E-mail et notification publiés pour le bon propriétaire ; facture inexistante → erreur |
| COP-IN-011 | `GetInvoicesByOwner` pour un autre propriétaire | I | P1 | OWN | Refus |
| COP-IN-012 | Écran factures du propriétaire + dialogue de paiement | E,V | P1 | OWN | Montants, devise et statut corrects ; parcours de paiement (voir PAY-ST-*) |

## COP-TR — Trésorerie, impayés et rapports

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-TR-001 | `GetTreasuryDashboard` sur la fixture (appels payés, en attente, en retard) | U,I | P1 | SYN | Encaissé, attendu et retard égaux aux sommes calculées à la main |
| COP-TR-002 | `GetTreasuryEvolution` sur 12 mois | U | P2 | SYN | Un point par mois, mois vides à 0, ordre chronologique |
| COP-TR-003 | Seuls les versements `Approved` comptent comme encaissés | U | P1 | — | Les versements `Pending`/`Rejected` sont exclus |
| COP-TR-004 | Les appels `Cancelled` sont exclus de l'attendu et du retard | U | P1 | — | Totaux sans les appels annulés |
| COP-TR-005 | `GetFinancialReport` (période) | U,I | P2 | SYN/CPT | Recettes, dépenses et solde cohérents ; copropriété inexistante → « Coproperty … not found » |
| COP-TR-006 | `GetUnpaidPaymentsSummary` | U,I | P1 | SYN | Liste par propriétaire, reste dû exact |
| COP-TR-007 | `GetOwnerPaymentSummary` | I | P1 | OWN | Uniquement ses données |
| COP-TR-008 | Devise : COPRO-A en TND (3 décimales), COPRO-B en EUR | U,V | P2 | — | Aucun mélange de devises entre copropriétés |
| COP-TR-009 | Écrans trésorerie, impayés et rapports (graphiques) | V | P2 | SYN/CPT | Captures de référence avec les données de la fixture |
| COP-TR-010 | Export d'un rapport (si disponible) | E | P3 | CPT | Fichier téléchargé, contenu conforme |
