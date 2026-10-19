# Facturation (invoice-management)

**Sources** : `Myb.Invoice.Infra/GraphQl/Mutations/InvoiceMutations.cs` (Add/Update/Delete pour Invoice, Client, Product, InvoiceDetails, Contact, Tax), `Querys/InvoiceQuery.cs` (GetAll*, Get*ByIds, Get*ByID), `Myb.Invoice.Services/*`, `Myb.Invoice.Models/*`. Front : `libs/invoice-module` (createInvoice, editInvoice, invoiceDetails, listInvoice, addItemToInvoice, client*, product*, tax*, addContact).
**Tests existants** : `unit-tests/invoice-management/` + 30 specs dans `libs/invoice-module`.

## INV-CL — Clients et contacts

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| INV-CL-001 | Ajouter, modifier, supprimer un client (types `ClientType`) | U,I,E | P2 | SYN | CRUD complet |
| INV-CL-002 | Supprimer un client qui a des factures | I | P1 | SYN | Refus, ou factures conservées |
| INV-CL-003 | Ajouter, modifier, supprimer un contact (`DeleteContatc`) | U,I | P3 | SYN | CRUD complet ; le nom mal orthographié de la mutation reste compatible avec le front |
| INV-CL-004 | `GetClientsByIds` avec des id inexistants | U | P3 | — | Ids inconnus ignorés, aucune exception |

## INV-PR — Produits et taxes

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| INV-PR-001 | CRUD produit (prix, `ProductType`) | U,I,E | P2 | SYN | OK |
| INV-PR-002 | CRUD taxe (taux en %) | U,I | P2 | SYN | OK ; taux négatif ou > 100 refusé |
| INV-PR-003 | Supprimer une taxe utilisée par une facture | I | P1 | SYN | Refus, ou montant historique figé |

## INV-IV — Factures

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| INV-IV-001 | Créer une facture avec 3 lignes (quantité × prix) et une taxe | U,I,E | P1 | SYN | `SubTotal` et `TotalAmount` exacts |
| INV-IV-002 | ⚠ Arrondis : montants en `double` (0,1 + 0,2 ; 3 × 33,33) | U | P1 | — | Totaux arrondis correctement à l'affichage et à l'enregistrement. **Risque** : `double` utilisé pour de l'argent dans `InvoiceModel`/`InvoiceDetails` |
| INV-IV-003 | Quantité nulle, négative ou vide | U,E | P2 | SYN | Rejetée |
| INV-IV-004 | Ajouter ou retirer une ligne d'une facture existante (`addItemToInvoice`) | U,I,E | P2 | SYN | Totaux recalculés |
| INV-IV-005 | Supprimer une facture | I | P2 | SYN | Lignes supprimées en cascade ; aucune ligne orpheline |
| INV-IV-006 | Isolation : factures d'un autre utilisateur ou d'une autre organisation via `GetInvoiceByID` | I | P1 | autre | Refus |
| INV-IV-007 | Liste, détail et impression d'une facture | E,V | P2 | SYN | Captures (liste, détail, rendu d'impression) |
