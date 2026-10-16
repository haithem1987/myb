# Communication Hub — Plan d'implémentation

**Branche :** `feature/communication-hub`  
**Auteur :** KHALIFA Haithem  
**Date :** 2026-10-16  
**Statut :** 🔍 À relire avant implémentation

---

## 1. Vision & Périmètre

Le **Communication Hub** est un module transversal qui centralise toute la communication sortante de la plateforme MYB.

### Ce que le module doit permettre

| Besoin | Description |
|---|---|
| **Historique global** | Voir toutes les notifications (in-app, push, email) envoyées, avec la date, le destinataire, le canal, le statut de livraison |
| **Traçabilité** | Savoir si un email a été envoyé, si un push a été reçu, si une notif a été lue |
| **Campagnes** | Lancer une communication ciblée (ex. : relancer tous les copropriétaires d'une copropriété qui n'ont pas payé leurs charges) |
| **Relances** | Programmer ou envoyer manuellement une relance sur un sujet précis |
| **Filtrage** | Filtrer par canal (email / push / in-app), par copropriété, par destinataire, par date, par statut |

### Ce qui est hors périmètre (v1)

- Gestion des templates d'email (déjà géré par `Myb.Mailer`)
- Campagnes SMS / WhatsApp
- Analytics avancées (open rate, click rate) — envisageable en v2

---

## 2. Architecture existante à connaître

```
Notification (in-app + push)
  └── NotificationService  ──►  SignalR Hub  (temps réel)
                           ──►  WebPushSender  (VAPID)
                           ──►  IEmailPublisher (RabbitMQ)

Email
  └── RabbitMQ "email-queue"  ──►  EmailConsumerWorker (Myb.Mailer)
                                       └── SmtpEmailSender
```

**Problème actuel :** aucun des trois canaux n'écrit d'entrée d'audit. Les notifications in-app sont stockées dans la table `Notifications`, mais sans statut de livraison push ni confirmation d'envoi email.

---

## 3. Modèle de données — CommunicationLog

### 3.1 Nouvelle table `CommunicationLogs`

```csharp
public class CommunicationLog
{
    public Guid Id { get; set; }

    // Qui a envoyé (service ou utilisateur)
    public string? SenderId { get; set; }          // userId ou nom du service
    public string SenderType { get; set; }         // "user" | "system" | "service"

    // Destinataire
    public string RecipientId { get; set; }        // userId
    public string? RecipientEmail { get; set; }    // email si canal email

    // Périmètre
    public Guid? CopropertyId { get; set; }

    // Canal
    public CommunicationChannel Channel { get; set; }  // InApp | Push | Email

    // Contenu
    public string Subject { get; set; }            // objet de l'email ou titre notif
    public string? Body { get; set; }              // corps (HTML pour email, texte pour notif)
    public string? TemplateId { get; set; }        // template mailer utilisé si applicable

    // Statut de livraison
    public DeliveryStatus Status { get; set; }     // Pending | Sent | Delivered | Failed | Read
    public string? FailureReason { get; set; }

    // Référence métier (ex. : "charge-reminder", "welcome", "budget-alert")
    public string? EventType { get; set; }
    public Guid? RelatedEntityId { get; set; }     // ex. : id de la charge
    public string? RelatedEntityType { get; set; } // ex. : "Charge"

    // Campagne (optionnel)
    public Guid? CampaignId { get; set; }

    public DateTimeOffset SentAt { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}

public enum CommunicationChannel { InApp, Push, Email }
public enum DeliveryStatus { Pending, Sent, Delivered, Failed, Read }
```

### 3.2 Table `CommunicationCampaigns`

```csharp
public class CommunicationCampaign
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public Guid? CopropertyId { get; set; }         // null = multi-copropriété
    public string CreatedBy { get; set; }            // userId gestionnaire
    public CampaignStatus Status { get; set; }       // Draft | Scheduled | Running | Completed | Cancelled
    public CommunicationChannel[] Channels { get; set; }  // canaux utilisés
    public string? TargetCriteria { get; set; }      // JSON : critères de ciblage
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int TotalRecipients { get; set; }
    public int SentCount { get; set; }
    public int FailedCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
```

---

## 4. Services — Ce qui doit changer

### 4.1 Instrumentation du NotificationService

Le `NotificationService` doit écrire un `CommunicationLog` à chaque envoi :

```csharp
// Dans NotificationService.SendNotificationAsync
await _communicationLogService.LogAsync(new CommunicationLogEntry {
    Channel = CommunicationChannel.InApp,
    RecipientId = request.ReceiverId,
    Subject = request.Message,
    Status = DeliveryStatus.Sent,
    EventType = request.EventType,
    CopropertyId = request.CopropertyId,
    SentAt = DateTimeOffset.UtcNow
});
```

Idem pour `WebPushSender` (statut `Delivered` ou `Failed` selon le résultat VAPID) et `IEmailPublisher` (statut `Sent` à la publication RabbitMQ).

### 4.2 Nouveau service `CommunicationLogService`

Responsabilités :
- `LogAsync(entry)` — écriture d'un log
- `UpdateStatusAsync(id, status, failureReason?)` — mise à jour du statut (ex. : push échoue)
- `QueryLogsAsync(filter)` — lecture paginée avec filtres
- `GetStatsAsync(copropertyId?)` — stats globales (count par canal/statut)

### 4.3 Nouveau service `CampaignService`

Responsabilités :
- `CreateCampaignAsync(dto)` — créer une campagne en `Draft`
- `StartCampaignAsync(campaignId)` — résoudre les destinataires, envoyer en batch, mettre à jour le statut
- `GetCampaignProgressAsync(campaignId)` — suivi temps réel
- `CancelCampaignAsync(campaignId)`

---

## 5. API — Nouveaux endpoints

### Communication Logs (lecture seule)

```
GET  /api/communication/logs
     ?copropertyId=&channel=&status=&recipientId=&from=&to=&page=&size=

GET  /api/communication/logs/{id}

GET  /api/communication/stats
     ?copropertyId=
```

### Campagnes

```
GET    /api/communication/campaigns          — liste des campagnes
POST   /api/communication/campaigns          — créer une campagne
GET    /api/communication/campaigns/{id}     — détail + progression
PUT    /api/communication/campaigns/{id}     — modifier (si Draft)
POST   /api/communication/campaigns/{id}/start    — lancer
POST   /api/communication/campaigns/{id}/cancel   — annuler
GET    /api/communication/campaigns/{id}/logs     — logs liés à la campagne
```

---

## 6. Frontend — Pages & composants

### 6.1 Nouvelle lib Angular `communication`

Sous `libs/communication/` (ou dans `libs/shared/infra/` si lib partagée).

**Services Angular :**
- `CommunicationLogService` — GET /api/communication/logs
- `CampaignService` — CRUD campagnes

### 6.2 Page « Centre de communication »

Accessible depuis le menu `admin` (gestionnaire / syndic).

**Onglet 1 — Historique**

| Colonne | Description |
|---|---|
| Date | Date d'envoi |
| Canal | Badge InApp / Push / Email |
| Destinataire | Nom + avatar |
| Sujet / Message | Texte tronqué |
| Statut | Badge Sent / Delivered / Failed / Read |
| Copropriété | Nom |
| Action | Voir détail |

Filtres : période, canal, statut, copropriété, destinataire.

**Onglet 2 — Campagnes**

Liste des campagnes avec statut, progression (barre), actions (lancer, annuler, voir logs).

Bouton "Nouvelle campagne" → wizard :
1. Nom + description
2. Sélection copropriété(s)
3. Ciblage (tous, non-payeurs, propriétaires sans push actif, etc.)
4. Canal(x) : email, push, in-app
5. Message / template
6. Planification (maintenant ou date)
7. Récapitulatif → Lancer

### 6.3 Composants réutilisables

- `<myb-channel-badge>` — badge canal avec icône
- `<myb-delivery-status-badge>` — badge statut livraison
- `<myb-campaign-progress>` — barre de progression campagne

---

## 7. Plan de migration DB

```
Migration 1 : AddCommunicationLogsTable
  - Créer table communication_logs avec tous les champs
  - Index sur (coproperty_id, sent_at DESC)
  - Index sur (recipient_id, sent_at DESC)
  - Index sur (campaign_id) où non null

Migration 2 : AddCommunicationCampaignsTable
  - Créer table communication_campaigns
  - FK communication_logs.campaign_id → communication_campaigns.id
```

---

## 8. Ordre d'implémentation recommandé

### Phase 1 — Backend (fondations)

1. `CommunicationLog` entity + migration
2. `CommunicationLogService` + `ICommunicationLogService`
3. Instrumentation de `NotificationService` (InApp + Push)
4. Instrumentation de `RabbitMqEmailPublisher` (Email)
5. `CommunicationLogsController` — GET logs + stats

### Phase 2 — Frontend (historique)

6. `CommunicationLogService` Angular
7. Page Historique avec filtres + tableau paginé
8. Intégration dans le menu admin

### Phase 3 — Campagnes

9. `CommunicationCampaign` entity + migration
10. `CampaignService` + ciblage
11. `CampaignsController`
12. Page Campagnes + wizard de création
13. Affichage progression en temps réel (SignalR ou polling)

---

## 9. Points à clarifier avant de commencer

- [ ] **Rétention des logs** : conserver indéfiniment ou purge après X mois ?
- [ ] **Corps des emails dans les logs** : stocker le HTML complet (lourd) ou seulement subject + templateId ?
- [ ] **Ciblage des campagnes** : les critères sont-ils statiques (ex. : liste d'userId) ou dynamiques (ex. : "tous les non-payeurs") ? Si dynamiques, qui fournit la requête (le service coproperty ?)
- [ ] **Droits d'accès** : seuls les gestionnaires/syndics voient le Communication Hub, ou aussi les administrateurs de copropriété ?
- [ ] **Phase 3 prioritaire ?** : voulez-vous les campagnes dès v1 ou commencer par l'historique seul ?

---

## 10. Risques & points d'attention

| Risque | Mitigation |
|---|---|
| Volume de logs élevé | Index appropriés + pagination côté API, envisager archivage |
| Instrumentation casse les envois existants | Logger en `fire-and-forget` (pas bloquant) avec try/catch isolé |
| Campagnes en batch bloquent le thread | Traitement en background job (IHostedService ou Hangfire) |
| Double log si RabbitMQ rejoue un message | Idempotency key sur le log (ex. : hash message+recipient+sentAt) |
