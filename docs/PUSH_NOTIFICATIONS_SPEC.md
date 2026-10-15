# Spécification — Notifications push (Web Push / PWA)

> Statut : proposition · Date : 2026-10-14 · Périmètre : app `client` (espace copropriétaire et syndic) + `notification-service`

## 1. Objectif

Prévenir le copropriétaire ou le syndic **sur son téléphone ou son ordinateur, même quand MYB est fermé** : nouvel appel de fonds, paiement validé ou rejeté, paiement reçu, changement de lot, etc.

Contraintes :
- **Gratuit** : aucun service payant, aucun compte Firebase obligatoire.
- **Réutiliser l'existant** : le `notification-service` stocke déjà les notifications et les envoie en temps réel. Le push devient un canal de plus, à côté de SignalR et de l'e-mail.
- **Sans application native** : on passe par la PWA, qui existe déjà.

## 2. Technologie retenue : Web Push standard (VAPID)

| Brique | Rôle | Coût |
|---|---|---|
| **Push API + Notifications API** (W3C) | Le navigateur s'abonne et affiche la notification | Gratuit |
| **VAPID** (RFC 8292) | Une paire de clés propre à MYB identifie notre serveur auprès des services push | Gratuit |
| **Chiffrement du message** (RFC 8291) | Le contenu est chiffré pour l'abonné : le service push ne le lit pas | Gratuit |
| **Services push des navigateurs** | Chrome/Edge/Android → FCM, Firefox → Mozilla Autopush, Safari/iOS → Apple Web Push | Gratuit, sans compte développeur |
| **Bibliothèque .NET** `Lib.Net.Http.WebPush` (MIT) | Signature VAPID, chiffrement et envoi HTTP depuis le `notification-service` | Gratuit |

Pourquoi pas Firebase Cloud Messaging en direct : cela demande un projet Firebase et un SDK de plus, sans apporter d'avantage sur le web. Avec VAPID, Chrome passe déjà par FCM sans qu'on ait besoin de compte.

### Compatibilité

| Plateforme | Support | Condition |
|---|---|---|
| Android (Chrome, Edge, Samsung Internet, Firefox) | ✅ | Aucune |
| Windows / macOS / Linux (Chrome, Edge, Firefox, Safari 16+) | ✅ | Aucune |
| **iPhone / iPad (iOS/iPadOS 16.4+)** | ⚠️ | **La PWA doit être installée sur l'écran d'accueil.** Dans Safari, sans installation, le push n'existe pas. |

## 3. Existant (constaté dans le code)

**Backend — `src/services/notification-service/Myb.Notification`**
- `Services/NotificationService.cs` : `SendNotificationAsync` enregistre la notification (PostgreSQL, ou base en mémoire en staging), puis appelle `Clients.User(receiverId).SendAsync("ReceiveNotification", message, copropertyId)`.
- `Controllers/NotificationsController.cs` : `POST /api/Notifications`, `GET /api/Notifications/{userId}`, `PUT .../{id}/read`, `PUT .../read-all/{userId}`, `POST .../email`.
- `Hubs/NotificationHub.cs` et `Providers/KeycloakUserIdProvider.cs` : l'identifiant utilisateur est le `sub` Keycloak (`ClaimTypes.NameIdentifier`).
- Authentification par JWT Keycloak. Toutes les routes demandent un utilisateur connecté (`FallbackPolicy`).
- Base de données : `context.Database.EnsureCreated()` et des `ALTER TABLE ... IF NOT EXISTS` lancés au démarrage (`Configuration/Configuration.cs`).

**Qui envoie des notifications** (`coproperty-management`, client HTTP `"NotificationService"` avec un jeton de service) :
- `FundCallService` : appel de fonds créé, mis à jour ou annulé ; paiement validé ou rejeté ; paiement reçu (vers le syndic).
- `ChargeService` : paiement d'une charge reçu (vers le syndic).
- `OwnershipNotificationService` : lot attribué ou retiré.
- `OwnerMutations` : profil mis à jour, compte activé.
- Les messages sont des **phrases en français, déjà rédigées**. Le front les retraduit avec des regex (`libs/shared/infra/utils/notification-message.ts`).

**Front — `src/front/myb.front`**
- `apps/client/src/manifest.webmanifest` : `display: standalone`, icônes 192 et 512, `start_url: /coproperty`.
- `apps/client/src/service-worker.js` : service worker **écrit à la main** (pas `@angular/service-worker`). Il ne met en cache que les fichiers statiques et n'a **aucun gestionnaire `push` ni `notificationclick`**.
- `apps/client/src/main.ts:9` : le service worker n'est enregistré **qu'en production**.
- `libs/shared/infra/services/notification.service.ts` : connexion SignalR, toasts, liste des notifications.
- URL du service : `environment.services.notification.baseUrl` (par exemple `${origin}/api/notification` sur OVH).

## 4. Prérequis sécurité (à faire avant ou avec le push)

Le push affiche des messages sur le téléphone des gens. Les failles actuelles de l'API prennent donc plus d'importance :

| # | Problème | Risque avec le push | Correction |
|---|---|---|---|
| S1 | `POST /api/Notifications` accepte n'importe quel `SenderId` ou `ReceiverId` venant de **n'importe quel utilisateur connecté** | Un copropriétaire peut envoyer des notifications push (spam, hameçonnage) à n'importe quel utilisateur | Réserver cette route aux comptes de service (rôle ou client Keycloak dédié). Pour un utilisateur, prendre `SenderId` dans le jeton. |
| S2 | `GET /api/Notifications/{userId}` et `PUT read-all/{userId}` font confiance au `userId` de l'URL | Un utilisateur peut lire ou marquer comme lues les notifications d'un autre | Remplacer par `/me` et prendre l'identifiant dans le `sub` du jeton |
| S3 | `PUT {notificationId}/read` ne vérifie pas que la notification appartient à l'utilisateur | Modification des données d'un autre utilisateur | Filtrer sur `ReceiverId == sub` |

Les nouvelles routes push (section 6) prennent **toujours** l'utilisateur dans le jeton, jamais dans le corps de la requête.

**Implémenté :**
- Un appelant est un « service de confiance » si le `azp` de son jeton figure dans `NotificationSecurity:TrustedServiceClients` (par défaut `myb-backend`, le client de service de `coproperty-management`).
- **S1** : les services de confiance peuvent notifier n'importe quel utilisateur, avec push. Un utilisateur peut encore notifier un autre utilisateur dans l'app (cas des feuilles de temps), mais `SenderId` est forcé au `sub` de son jeton, le message est limité à 1 000 caractères et **il ne part jamais en push**.
- **S2 et S3** : un utilisateur ne peut lire ou modifier que ses propres notifications ; sinon la réponse est `403` ou `404`.
- **S4** (trouvée pendant l'implémentation) : `POST /api/Notifications/email` permettait d'envoyer un e-mail HTML à n'importe qui. La route est désormais réservée aux services ; aucun appel front n'existait.
- Les endpoints d'abonnement ne sont acceptés qu'en HTTPS, sur les domaines des services push connus (`Push:AllowedEndpointHosts`), pour empêcher les attaques SSRF.

## 5. Fonctionnement

```
coproperty-management ──POST /api/Notifications──▶ notification-service
                                                    │ 1. enregistre la Notification (existant)
                                                    │ 2. SignalR → onglets ouverts (existant)
                                                    │ 3. NOUVEAU : met l'envoi push dans une file
                                                    ▼
                                         PushDispatcher (BackgroundService)
                                                    │ lit les abonnements du destinataire
                                                    │ chiffre le message et signe avec VAPID
                                                    ▼
                                FCM / Mozilla / Apple (services push gratuits)
                                                    ▼
                                service-worker.js → showNotification()
                                                    ▼  clic
                                ouvre ou réaffiche MYB sur la bonne page
```

### Abonnement (côté front)
1. L'utilisateur clique sur « Activer les notifications » : bandeau dans l'espace copropriétaire ou syndic, et réglage dans *Mon profil*. **On ne demande jamais l'autorisation sans clic** : Chrome bloque les demandes trop insistantes.
2. `Notification.requestPermission()`, puis `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
3. Envoi de `{ endpoint, keys: { p256dh, auth } }` à `POST /api/push/subscriptions`.
4. À la **déconnexion** : `subscription.unsubscribe()` et `DELETE /api/push/subscriptions`. Sinon, un téléphone partagé continuerait à recevoir les notifications de l'ancien compte.
5. Sur iOS, si la PWA n'est pas installée (`navigator.standalone !== true`), on affiche la marche à suivre « Partager → Sur l'écran d'accueil » à la place du bouton.

### Envoi (côté serveur)
- Après l'envoi SignalR, `SendNotificationAsync` dépose un `PushJob` dans un `Channel<PushJob>` puis rend la main. **Le push ne doit jamais ralentir ni faire échouer l'appel métier.** C'est la règle déjà appliquée pour SignalR (« BestEffort »).
- Le `PushDispatcher` envoie le message à **chaque appareil** de l'utilisateur.
- Réponse **404 ou 410** du service push : l'abonnement est supprimé (il a expiré ou a été révoqué).
- Réponse **429 ou 5xx** : on réessaie 3 fois au plus, en attendant de plus en plus longtemps (2 s, 10 s, 60 s), puis on augmente `FailureCount`. L'abonnement est supprimé au bout de 10 échecs d'affilée.
- `TTL` de 24 h : un message qui n'a pas pu être remis dans ce délai ne sert plus à rien.
- `Topic` égal à `notificationId` et `Urgency` normale. Mettre `high` pour « paiement rejeté » et « appel de fonds créé ».

### Ne pas notifier deux fois
Si un onglet MYB est **visible**, le toast SignalR suffit. Dans le gestionnaire `push`, le service worker vérifie `clients.matchAll({ type: 'window' })` : si une fenêtre a le focus, il n'affiche rien et lui transmet un message (`postMessage`). Sinon, il appelle `showNotification`.

## 6. API à ajouter (`notification-service`)

| Méthode | Route | Authentification | Corps / réponse |
|---|---|---|---|
| `GET` | `/api/push/vapid-public-key` | utilisateur | `{ publicKey: "B..." }` |
| `POST` | `/api/push/subscriptions` | utilisateur | `{ endpoint, keys: { p256dh, auth }, userAgent? }` → `204`. Création ou mise à jour par `endpoint`. Si l'appareil appartenait à un autre utilisateur, il est réattribué à l'utilisateur courant. |
| `DELETE` | `/api/push/subscriptions` | utilisateur | `{ endpoint }` → `204` (ne supprime que les abonnements de l'utilisateur courant) |
| `POST` | `/api/push/test` | utilisateur | Envoie « Notifications activées ✅ » sur ses propres appareils |

`POST /api/Notifications` reçoit un champ **optionnel** `Url` (lien profond, voir 7.2). Les appels actuels continuent de fonctionner sans changement.

## 7. Données

### 7.1 Nouvelle table `PushSubscriptions`

| Colonne | Type | Notes |
|---|---|---|
| `Id` | text (GUID) | Clé primaire |
| `UserId` | text | `sub` Keycloak. Index. |
| `Endpoint` | text | **Unique** |
| `P256dh` | text | Clé publique du navigateur |
| `Auth` | text | Secret d'authentification |
| `UserAgent` | text null | Pour afficher « Chrome sur Android » dans le profil |
| `CreatedAt`, `LastSuccessAt` | timestamptz | |
| `FailureCount` | int | Remis à zéro à chaque envoi réussi |

Création au démarrage avec un `CREATE TABLE IF NOT EXISTS` idempotent, **comme ce que fait déjà `Configuration.cs`**, puisque ce service n'a pas d'historique de migrations EF fiable.

### 7.2 Contenu du message (JSON chiffré, ≤ 4 Ko)

```json
{
  "notificationId": "…",
  "title": "MYB · Residence El DAHCHA",
  "body": "Votre paiement de 6 250 DT pour « Répartition 2026 » a été validé.",
  "url": "/coproperty/{copropertyId}/owner/charges",
  "copropertyId": "…",
  "tag": "fund-…"
}
```

- `title` : « MYB », suivi du nom de la copropriété quand on le connaît. Le nom peut être passé par l'appelant, ou bien on garde « MYB » seul en phase 1.
- `body` : le `Message` existant, coupé à 180 caractères.
- `url` : la valeur envoyée par l'appelant, sinon `/coproperty`. Correspondances proposées :
  - appel de fonds ou paiement (copropriétaire) → `/coproperty/{id}/owner/charges`
  - paiement reçu (syndic) → page des paiements du syndic
  - attribution de lot → `/coproperty/{id}/owner/my-units`
  - Les pages syndic se trouvent dans l'app admin, sous `/admin/coproperty/{id}/syndic/...`. Le service worker est enregistré à la racine, sur le même domaine, donc il couvre aussi `/admin/`. La liste complète des liens est dans `Myb.Coproperty/Services/NotificationLinks.cs`.

**Langue (phase 2).** Les messages sont enregistrés en français. Le service worker ne peut pas utiliser `ngx-translate`. Il faut donc ajouter à `Notification` les champs `Type` (par exemple `paymentApproved`) et `Params` (JSON), puis choisir la langue côté serveur à partir de la préférence de l'utilisateur. Ce changement permettra aussi de supprimer les regex de `notification-message.ts`.

## 8. Service worker (`apps/client/src/service-worker.js`)

À ajouter :
- **`push`** : lire le JSON, vérifier les fenêtres ouvertes (section 5), puis `self.registration.showNotification(title, { body, icon: '/assets/icons/icon-192.png', badge, tag, data: { url, notificationId } })`.
- **`notificationclick`** : `event.notification.close()`. Si une fenêtre MYB est déjà ouverte, la passer au premier plan et l'envoyer sur `url`. Sinon, `clients.openWindow(url)`. N'accepter que des **URL relatives au même site**, pour éviter qu'une notification redirige vers un site externe.
- **`pushsubscriptionchange`** : se réabonner, puis `POST /api/push/subscriptions`. Sans jeton disponible, marquer l'abonnement à resynchroniser au prochain lancement de l'app.
- Incrémenter `CACHE_NAME` à `myb-app-v4` pour forcer la mise à jour du service worker.
- Ajouter un **badge** monochrome de 96×96 (`assets/icons/badge-96.png`) pour la barre d'état Android.

## 9. Configuration

| Variable | Exemple | Secret |
|---|---|---|
| `Push__VapidPublicKey` | `BOr…` (base64url) | non |
| `Push__VapidPrivateKey` | `…` | **oui** : secret Kubernetes, Render ou Railway. Jamais dans git. |
| `Push__Subject` | `mailto:support@myb-platform.com` | non |
| `Push__Enabled` | `true` | non. Si `false` ou si les clés manquent, l'envoi est désactivé et un warning est écrit au démarrage. |

Les clés se génèrent **une seule fois par environnement**, par exemple avec `npx web-push generate-vapid-keys`. **Changer la clé privée invalide tous les abonnements existants.**

Fichiers de déploiement à mettre à jour :
- `ovhcloud/k8s/services/notification/deployment.yaml`
- `render.yaml`
- `docker-compose*.yml`
- `terraform/environments/*`

## 10. Plan d'implémentation

### Phase 0 — Sécurité (½ à 1 jour)
- [ ] S1 : réserver `POST /api/Notifications` aux comptes de service. Vérifier que `coproperty-management` utilise bien son jeton de service ; c'est déjà le cas dans `FundCallService.NotifyOwnerDataChangedAsync`, à confirmer pour `ChargeService`, `CopropertyMutations` et `OwnerMutations`.
- [ ] S1 : modifier le front `NotificationService.sendToUser`. Soit il passe par une mutation métier, soit on lui crée une route dédiée où l'expéditeur est le `sub` du jeton.
- [ ] S2 et S3 : passer aux routes `/me` et adapter `notification.service.ts`.

### Phase 1 — Backend push (2 jours)
- [ ] Ajouter `Lib.Net.Http.WebPush` au `.csproj`.
- [ ] Créer `Models/PushSubscription.cs`, déclarer le `DbSet` dans `NotificationContext` et ajouter le `CREATE TABLE IF NOT EXISTS` idempotent dans `Configuration.cs`.
- [ ] Créer `Configuration/PushOptions.cs`, lié à la section `Push`.
- [ ] Créer `Services/PushSubscriptionStore.cs` : `UpsertAsync`, `RemoveAsync`, `GetByUserAsync`, `MarkSuccess/Failure`.
- [ ] Créer `Services/PushDispatcher.cs` : `BackgroundService` qui lit un `Channel<PushJob>`, avec les règles d'envoi et de nouvel essai de la section 5.
- [ ] Créer `Controllers/PushController.cs` avec les routes de la section 6.
- [ ] Dans `NotificationService.SendNotificationAsync`, mettre le push en file après SignalR, sans attendre et sans faire échouer l'appel en cas d'erreur.
- [ ] Ajouter le champ optionnel `Url` à `NotificationRequest`.

### Phase 2 — Front (2 jours)
- [ ] Créer `libs/shared/infra/services/push-notification.service.ts` : `isSupported()`, `permission$`, `enable()`, `disable()`, `syncOnStartup()`.
- [ ] Gestionnaires `push`, `notificationclick` et `pushsubscriptionchange` dans `apps/client/src/service-worker.js`, plus l'icône badge.
- [ ] Bandeau « Activer les notifications » dans `owner-layout` et `syndic-layout`. Un refus est mémorisé 30 jours.
- [ ] Interrupteur et liste des appareils dans *Mon profil*.
- [ ] Désabonnement dans le flux de déconnexion Keycloak.
- [ ] Aide à l'installation sur iOS.
- [ ] Clés i18n en FR, EN et AR.
- [ ] Permettre de tester en développement : enregistrer le service worker aussi sur `localhost`, derrière un flag d'environnement (`environment.pwaInDev`).

### Phase 3 — Branchement des événements (1 jour)
- [ ] Passer `Url` dans tous les appels existants : `FundCallService` (5 cas), `ChargeService`, `OwnershipNotificationService`, `OwnerMutations`.
- [ ] Mettre `Urgency=high` pour « appel de fonds créé » et « paiement rejeté ».

### Phase 4 — Tests et déploiement (1 à 2 jours)
- [ ] Tests unitaires (`src/tests/unit-tests`) :
  - réponse 410 → l'abonnement est supprimé ;
  - réponse 429 → nouvel essai ;
  - réattribution d'un abonnement à l'utilisateur courant ;
  - S1 à S3 refusés pour un autre utilisateur.
- [ ] Test de bout en bout : avec Playwright et `context.grantPermissions(['notifications'])`, vérifier que l'abonnement est enregistré et que `/api/push/test` renvoie 204.
- [ ] Tests manuels :
  - Chrome sur Windows, Android et Firefox, app fermée ;
  - iPhone sous iOS 17 ou plus, avec la PWA installée ;
  - clic sur la notification → bonne page ;
  - après déconnexion → plus aucune notification.
- [ ] Générer les clés VAPID pour chaque environnement et déclarer les secrets.

**Charge estimée : 6,5 à 8 jours-homme.**

### Phase 5 — Évolutions (plus tard)
- Notifications traduites dans la langue de l'utilisateur (`Type` + `Params`, voir 7.2).
- Préférences par catégorie (paiements, appels de fonds, AG, signalements) et heures de silence.
- Rappels d'échéance programmés : par exemple J-7 et J-1 avant la date limite d'un appel de fonds.
- Statistiques : taux d'abonnement et taux de clic, utiles pour l'argumentaire commercial.

## 11. Critères d'acceptation

1. Un copropriétaire qui a activé les notifications reçoit, **app fermée**, une notification système dans les 10 secondes après la validation de son paiement par le syndic.
2. Un clic sur la notification ouvre MYB sur la bonne page de la bonne copropriété.
3. Si MYB est ouvert et visible, on n'affiche que le toast existant, sans notification en double.
4. Après déconnexion, l'appareil ne reçoit plus rien.
5. Un utilisateur ne peut ni envoyer de notification à un autre utilisateur, ni lire les siennes (S1 à S3).
6. Si les services push sont indisponibles, aucune action métier n'échoue et aucune erreur ne s'affiche.
7. Aucun coût externe : seules les clés VAPID et les services push gratuits des navigateurs sont utilisés.

## 12. Limites connues
- **iOS** : il faut installer la PWA. C'est un passage à accompagner dans l'onboarding.
- **Remise non garantie** : le mode économie d'énergie d'Android ou un navigateur fermé de force peuvent retarder ou perdre un message. Le push complète l'e-mail et l'historique dans l'app, il ne les remplace pas.
- **Staging en mémoire** : si aucune base PostgreSQL n'est configurée, les abonnements sont perdus à chaque redémarrage du service.
