# Notifications in-app, temps réel et push

**Sources** : `NotificationsController` (`POST /api/notifications`, `GET /{userId}`, `POST /email`, `PUT /{id}/read`, `PUT /read-all/{userId}`), `NotificationService`, `Hubs/NotificationHub.cs` + `Providers/KeycloakUserIdProvider.cs` (SignalR), `PushController` (`/api/push` : vapid-public-key, subscriptions POST/DELETE, test), `PushDispatcher`, `WebPushSender`, `PushSubscriptionStore`, `Security/CallerIdentity.cs`. Front : `notification-dropdown`, `push-opt-in`.
**Tests existants** : `unit-tests/notification/NotificationsControllerSecurityTests.cs`, `PushTests.cs`.

## NOT-IN — In-app et SignalR

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| NOT-IN-001 | Un service crée une notification pour `own-1` | I | P1 | SVC | Notification enregistrée et poussée sur le hub uniquement à `own-1` (`KeycloakUserIdProvider` = `sub`) |
| NOT-IN-002 | `own-2`, connecté au hub, ne reçoit pas la notification de `own-1` | I | P1 | OWN | Aucun message reçu |
| NOT-IN-003 | Connexion au hub sans jeton ou avec un jeton expiré | I | P1 | ANON | Connexion refusée |
| NOT-IN-004 | `GET /api/notifications/{userId}` : les siennes, celles d'un autre | I | P1 | OWN | 200 / 403 (voir SEC-SVC-003) |
| NOT-IN-005 | Marquer comme lue, puis tout marquer comme lu | I,E | P2 | OWN | Compteur du dropdown à 0 ; impossible pour les notifications d'un autre utilisateur |
| NOT-IN-006 | Dropdown : badge, liste, lien profond (`NotificationLinks`) | E,V | P2 | OWN/SYN | Le clic mène à la bonne page (appel de fonds, signalement…) |
| NOT-IN-007 | Reconnexion SignalR après une coupure réseau | E | P3 | OWN | Reconnexion automatique, notifications manquées rechargées |
| NOT-IN-008 | `POST /api/notifications/email` | I | P2 | SVC | Message publié sur RabbitMQ (voir MAIL-*) |

## NOT-PU — Web Push

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| NOT-PU-001 | `GET vapid-public-key` | I | P3 | ANON/OWN | Clé publique renvoyée |
| NOT-PU-002 | S'abonner (endpoint, p256dh, auth), puis s'abonner à nouveau avec le même endpoint | U,I | P2 | OWN | Abonnement enregistré une seule fois (upsert) |
| NOT-PU-003 | Se désabonner | I | P2 | OWN | Abonnement supprimé ; ne peut pas supprimer celui d'un autre utilisateur |
| NOT-PU-004 | Le push service renvoie 404 ou 410 (`Gone`) | U | P2 | — | Abonnement purgé automatiquement |
| NOT-PU-005 | Erreur temporaire (5xx) | U | P3 | — | Abonnement conservé |
| NOT-PU-006 | `POST test` | I | P3 | OWN | Push reçu sur ses propres appareils uniquement |
| NOT-PU-007 | Bandeau `push-opt-in` : accepter, refuser, permission navigateur déjà refusée | E,V | P3 | OWN | Le choix est mémorisé ; le bandeau ne revient pas |
