# Rapprochement bancaire

**Sources** : `Myb.Payment/BankStatementController.cs` (`/api/bank-statements` : import, list, `{id}/reconciliation`, `{id}/export`, `{statementId}/reconciliation/{resultId}/validate`, `fund-calls/active`), `BankStatementParser.cs` (OFX, CSV, PDF via extraction de texte), `ReconciliationEngine.cs`, `FundCallServiceClient.cs` → `coproperty /internal/fund-calls`. Front : `bank-reconciliation`.
**Tests existants** : `unit-tests/payment/BankStatementParserTests.cs`, `ReconciliationEngineTests.cs`, `FundCallIntegrationTests.cs`.

## PAY-PR — Lecture des relevés

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| PAY-PR-001 | OFX valide (plusieurs `STMTTRN`, crédits et débits) | U | P1 | — | Transactions avec date, montant signé et libellé |
| PAY-PR-002 | CSV avec `;` puis avec `,` comme séparateur, en-tête FR/EN | U | P1 | — | Séparateur détecté, colonnes associées |
| PAY-PR-003 | CSV avec champs entre guillemets contenant le séparateur | U | P1 | — | `SplitCsvLine` découpe correctement |
| PAY-PR-004 | Montants « 1 234,567 », « 1.234,56 », « -50.00 » ; dates `dd/MM/yyyy` et ISO | U | P1 | — | Valeurs décimales exactes (`NormaliseAmt`) |
| PAY-PR-005 | Fins de ligne CRLF et lignes vides | U | P2 | — | Aucune transaction fantôme |
| PAY-PR-006 | PDF de relevé (colonnes débit/crédit, ligne « Solde ») | U | P2 | — | Solde d'ouverture et transactions extraits ; lignes sans date ignorées |
| PAY-PR-007 | Format non supporté (`.xlsx`) | U,I | P2 | SYN | 400 « Unsupported file format. Please upload an OFX, CSV, or PDF file. » |
| PAY-PR-008 | Fichier vide ou absent | I | P2 | SYN | 400 « No file uploaded. » |
| PAY-PR-009 | Fichier corrompu | I | P2 | SYN | 400 « Failed to parse file: … » ; aucun relevé partiel enregistré |
| PAY-PR-010 | Format demandé inconnu passé au parser | U | P3 | — | `NotSupportedException` |

## PAY-RC — Moteur de rapprochement

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| PAY-RC-001 | Même montant, écart de date de 0 à 3 jours | U | P1 | — | `AutoMatched` |
| PAY-RC-002 | Même montant, écart de 4 jours | U | P1 | — | `ManualSuggestion` |
| PAY-RC-003 | Aucun paiement de ce montant | U | P1 | — | `Unmatched` avec note |
| PAY-RC-004 | Deux transactions identiques pour un seul paiement attendu | U | P1 | — | La première en `AutoMatched`, la seconde en `Unmatched` (paiement déjà utilisé) |
| PAY-RC-005 | ⚠ Deux transactions qui obtiennent toutes deux une `ManualSuggestion` vers le même paiement | U | P2 | — | **Risque** : une `ManualSuggestion` ne réserve pas le paiement (`usedPaymentIds` n'est pas alimenté), donc un même paiement peut être suggéré deux fois. Comportement à décider |
| PAY-RC-006 | Plusieurs candidats dans la fenêtre de 3 jours | U | P2 | — | Le choix est déterministe (le plus proche en date ou le premier : à fixer) |
| PAY-RC-007 | Transactions de débit (montant négatif) | U | P2 | — | Exclues ou `Unmatched` (règle à fixer) |

## PAY-RV — Validation et export

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| PAY-RV-001 | Valider une suggestion en l'associant à un appel de fonds | I | P1 | SYN | Statut validé + appel `POST /internal/fund-calls/{id}/payments/from-bank` ; versement créé côté coproperty (COP-FX-005) |
| PAY-RV-002 | Valider deux fois le même résultat | I | P1 | SYN | Pas de double versement |
| PAY-RV-003 | Service coproperty indisponible pendant la validation | I | P1 | SYN | Erreur visible ; le rapprochement n'est pas marqué validé, ou il est marqué « à resynchroniser » |
| PAY-RV-004 | Résultat ou relevé inexistant | I | P3 | SYN | 404 |
| PAY-RV-005 | Export CSV (`{id}/export`) | I | P2 | SYN/CPT | `text/csv; charset=utf-8`, BOM/UTF-8 correct pour Excel, une ligne par transaction |
| PAY-RV-006 | Liste des relevés (`GET ?copropertyId=`) | I | P2 | SYN | Les 20 derniers relevés de cette copropriété, avec leurs compteurs |
| PAY-RV-007 | ⚠ Liste sans `copropertyId`, ou avec celui de COPRO-B | I | P1 | SYN | Attendu : refus ou filtre sur le périmètre de l'appelant. **Risque** : contrôleur sans `[Authorize]` et sans contrôle de copropriété, donc relevés de tous les syndics visibles |
| PAY-RV-008 | Écran rapprochement : import, tableau à 3 statuts, validation manuelle | E,V | P1 | SYN | Parcours complet ; capture |
