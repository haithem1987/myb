# Paiement en ligne (Stripe) et abonnements

**Sources** : `Myb.Payment/PaymentController.cs` (`/api/payment` : create-payment-intent, start-trial, subscriptions/coproperty/{id}, subscriptions/{userId}, unsubscribe/{userId}/{serviceId}, pay-charge, charge-payments/{userId}), `PaymentService.cs`, `common/Myb.Common.Stripe`. Front : `libs/shared` (payment, subscriptions, user-dropdown). Spécification : `docs/Cahier de spécifications – Gestion des abonnements.md`.

## PAY-ST — Paiement d'une charge

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| PAY-ST-001 | `create-payment-intent` valide (clé Stripe de test) | I | P1 | OWN | `clientSecret` renvoyé ; montant en plus petite unité de la devise |
| PAY-ST-002 | `pay-charge` avec un montant ≤ 0 | I | P1 | OWN | 400 « Amount must be greater than zero. » |
| PAY-ST-003 | `pay-charge` sans `ChargeDistributionId` | I | P1 | OWN | 400 « ChargeDistributionId is required. » |
| PAY-ST-004 | ⚠ `pay-charge` quand Stripe échoue | I | P1 | OWN | Attendu : aucun paiement `Paid` enregistré. **Risque** : l'exception Stripe est avalée et le paiement est quand même enregistré `Paid` (fallback de dev actif dans tous les environnements) |
| PAY-ST-005 | ⚠ `pay-charge` avec un montant différent de la part due | I | P1 | OWN | Attendu : montant vérifié côté serveur. **Risque** : le montant vient du client |
| PAY-ST-006 | ⚠ `pay-charge` pour le `UserId` d'un autre utilisateur | I | P1 | OWN | Attendu : 403. Vérifier si l'identité est contrôlée sur cet endpoint |
| PAY-ST-007 | ⚠ `ChargeName`/`UnitNumber` contenant du HTML dans l'e-mail de confirmation | U | P2 | — | Attendu : contenu échappé. **Risque** : interpolation directe dans `HtmlBody` |
| PAY-ST-008 | E-mail de confirmation en fr et en en (`Language`) | U | P3 | — | Sujet et corps dans la bonne langue ; montant au format `0.###` |
| PAY-ST-009 | `charge-payments/{userId}` pour soi, puis pour un autre utilisateur | I | P1 | OWN | 200 / 403 |
| PAY-ST-010 | Paiement par carte depuis le dialogue de paiement (carte de test Stripe 4242…, refus 4000 0000 0000 0002, 3DS) | E | P1 | OWN | Succès ; carte refusée → message, rien n'est enregistré ; 3DS → modale |
| PAY-ST-011 | Webhook Stripe (s'il existe) : signature valide ou invalide | I | P1 | ANON | Événement traité / 400 |

## PAY-SB — Abonnements

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| PAY-SB-001 | `start-trial` valide | I | P1 | SYN | Abonnement `Trial` (service 1), expiration à J+30 |
| PAY-SB-002 | `start-trial` sans `UserId` ou sans `CopropertyId` | I | P2 | SYN | 400 « UserId and CopropertyId are required. » |
| PAY-SB-003 | `start-trial` sans jeton | I | P1 | ANON | 401 |
| PAY-SB-004 | `start-trial` pour un autre `UserId` | I | P1 | SYN | 403 |
| PAY-SB-005 | `start-trial` alors qu'un essai existe déjà pour cette copropriété, chez un autre utilisateur | I | P1 | SYN | 403 |
| PAY-SB-006 | `start-trial` relancé par le même utilisateur | I | P2 | SYN | Idempotent : l'essai existant est renvoyé, pas prolongé |
| PAY-SB-007 | `unsubscribe` d'un essai | I | P2 | SYN | 400 « A free trial cannot be cancelled or restarted. » |
| PAY-SB-008 | `unsubscribe` d'un abonnement inexistant | I | P3 | SYN | 404 |
| PAY-SB-009 | `subscriptions/{userId}` pour un autre utilisateur | I | P1 | SYN | 403 |
| PAY-SB-010 | Essai expiré → contrôle d'accès selon le statut (spec §9) | I,E | P1 | SYN | Accès restreint conformément à la spécification |
| PAY-SB-011 | Service de paiement arrêté : le menu utilisateur (`user-dropdown`) charge l'abonnement | E | P2 | SYN | Aucune erreur bloquante ; badge masqué ou dégradé |
| PAY-SB-012 | Page abonnements et tunnel d'abonnement | E,V | P2 | SYN | Captures et parcours de la spec §8 |
