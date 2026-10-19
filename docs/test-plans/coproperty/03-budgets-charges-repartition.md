# Budgets, charges et répartition

**Sources** : `ChargeMutations` (CreateChargeWithDates, UpdateChargeWithDates, UpdateCharge, DeleteCharge, DistributeCharge, CreateDistribution, MarkChargeDistributionPaid), `ChargeQueries`, `ChargeService` (`DistributeChargeAsync` l.~90-160, `CreateDistributionAsync` l.~185-290, `BuildDistributions` l.~305). Front : `charges-list`, `budget-new`, `charge-management`, `charge-distribution`, `charges`.
**Fixture** : COPRO-A (tantièmes 100/200/300/400 = 1000 ; surfaces 80/120/0/150 = 350 m²).

## COP-CH — Charges

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-CH-001 | Créer une charge (type, fréquence, montant, méthode de répartition, dates) | U,I,E | P1 | SYN | Charge créée dans COPRO-A |
| COP-CH-002 | Date de fin antérieure ou égale à la date de début (création et modification) | U | P2 | SYN | « La date de fin doit être postérieure à la date de début. » |
| COP-CH-003 | Créer ou modifier une charge dans COPRO-INACTIVE | U,I | P1 | SYN | Refus « inactive coproperty » |
| COP-CH-004 | Montant négatif ou nul | U,E | P2 | SYN | Rejeté |
| COP-CH-005 | Supprimer une charge qui a des répartitions payées | I | P1 | SYN | Refusé ou historique conservé (règle à confirmer) ; aucune perte de paiement |
| COP-CH-006 | `GetActiveCharges` | U | P3 | SYN | Uniquement les charges dont la période couvre la date de référence |
| COP-CH-007 | Chaque type (Cleaning…Other) × chaque fréquence (Monthly, Quarterly, Annual, Exceptional) | U | P3 | — | Sérialisation GraphQL de l'enum correcte, aller-retour sans perte |

## COP-DS — Répartition (`DistributeCharge`)

Charge de 1000 TND :

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-DS-001 | `ByShares` | U | P1 | — | 100 / 200 / 300 / 400 |
| COP-DS-002 | `ByArea` | U | P1 | — | 228,571 / 342,857 / 0 / 428,571 ; B201 (0 m²) paie 0 |
| COP-DS-003 | `Equal` | U | P1 | — | 250 × 4 |
| COP-DS-004 | `Custom` via le chemin `BuildDistributions` | U | P2 | — | « Custom distributions must provide explicit per-unit values. » |
| COP-DS-005 | ⚠ `DistributeCharge` en `ByShares` alors que tous les lots ont 0 tantième (ou `ByArea` avec toutes les surfaces à 0) | U | P1 | — | Attendu : erreur métier claire. **Risque** : `DistributeChargeAsync` divise par `totalShares`/`totalArea` sans garde-fou → `DivideByZeroException`. `BuildDistributions`, lui, est protégé |
| COP-DS-006 | ⚠ Arrondi : 100 TND en `Equal` sur 3 lots | U | P1 | — | La somme des parts doit être égale au total (règle de reste à définir). **Risque** : aucune gestion du reste → 33,333 × 3 = 99,999 |
| COP-DS-007 | Relancer la répartition (idempotence) | U,I | P1 | SYN | Les répartitions `Unpaid` sont remplacées, les `Paid` conservées, pas de doublon |
| COP-DS-008 | Relancer après qu'une part a été payée | I | P1 | SYN | La part payée n'est pas recalculée ; le total reste cohérent (règle à documenter) |
| COP-DS-009 | Copropriété sans lot | U | P2 | — | « The selected coproperty has no units to distribute. » |
| COP-DS-010 | `MarkChargeDistributionPaid` | I | P2 | SYN | Statut `Paid` ; visible dans `GetOwnerChargeDistributions` |
| COP-DS-011 | `GetOwnerChargeDistributions` pour `own-1` | I | P1 | OWN | A101 + A102 uniquement |

## COP-BG — Budget avec appels de fonds (`CreateDistribution`)

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-BG-001 | Budget valide : 2 charges + 4 échéances trimestrielles | U,I,E | P1 | SYN | Appels de fonds créés par propriétaire et par échéance ; `CurrencySnapshot` = devise de la copropriété ; une notification par appel créé |
| COP-BG-002 | `CopropertyId` absent | U | P2 | — | « CopropertyId is required. » |
| COP-BG-003 | Aucune charge | U | P2 | — | « At least one charge is required. » |
| COP-BG-004 | Aucune échéance | U | P2 | — | « At least one call for funds is required. » |
| COP-BG-005 | Charge d'une autre copropriété | U,I | P1 | — | « One or more charges do not belong to the selected coproperty. » |
| COP-BG-006 | Échéance d'une autre copropriété, ou montant ≤ 0 | U | P1 | — | Messages « Every call for funds must… » |
| COP-BG-007 | Propriétaire introuvable | U | P2 | — | « One or more owners could not be found. » |
| COP-BG-008 | Échec au milieu de l'enregistrement | I | P1 | — | Rollback de toute la transaction ; aucune notification envoyée |
| COP-BG-009 | Somme des appels de fonds par propriétaire = sa quote-part du budget | U | P1 | — | Égalité au millime près |
| COP-BG-010 | Écran « Nouveau budget » : assistant, aperçu de la répartition, validation | E,V | P1 | SYN | Parcours complet ; l'aperçu correspond au résultat du backend |
| COP-BG-011 | Rouvrir un budget existant (`budgets/:id`, `budgets/:id/edit`) | E | P2 | SYN | Données rechargées, modifications enregistrées |
