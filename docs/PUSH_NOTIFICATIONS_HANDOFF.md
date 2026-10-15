# Notifications push — passation pour terminer la PR #3

> PR : https://github.com/haithem1987/myb/pull/3 · Branche : `feature/push-notifications` → `main`
> Spécification fonctionnelle et technique : [PUSH_NOTIFICATIONS_SPEC.md](PUSH_NOTIFICATIONS_SPEC.md)

La fonctionnalité est **développée et testée en local** : backend, front, tests unitaires et outillage Docker. Ce document liste ce qui reste à faire avant la fusion et la mise en production. Il y a deux rôles :

- **A. Développeur** : finir la PR (revue, tests en échec, tests sur appareils réels).
- **B. DevOps / Kubernetes** : CI et secrets de déploiement.

## État actuel de la PR

| Point | État |
|---|---|
| Conflits avec `main` | aucun, fusionnable |
| Protection de branche / revue obligatoire | aucune sur `main` |
| CI « Run Tests » | ❌ échoue sur les tests `coproperty-management` (compilation) et `coproperty-payment` (1 test). Même chose sur `main`, sans lien avec cette PR |
| CI « Build and Push Docker Images » | ❌ connexion au registre impossible : secrets GitHub manquants (même erreur sur `main`) |
| Nouveaux tests `notification` (37) et front push (4) | ✅ verts |
| Revue de code | à faire |

## Comment ça marche (rappel en 30 secondes)

- Quand `coproperty-management` signale un événement au `notification-service` (appel de fonds, paiement validé ou refusé, paiement reçu, changement de lot…), la notification est enregistrée, affichée dans l'app (cloche et toast) **et envoyée en Web Push** aux appareils de la personne.
- L'utilisateur active le push lui-même : bandeau « Activer les notifications » dans son espace, ou réglage dans *Mon profil*.
- Le push utilise les services gratuits des navigateurs (FCM, Mozilla, Apple), authentifiés par une paire de clés **VAPID** propre à chaque environnement.
- **Sans clés VAPID, le service démarre normalement et seul le push est désactivé.** Le déploiement n'est donc pas bloquant.

---

## A. Développeur — terminer la PR

### A1. Revue du code

À relire en priorité :

| Fichier | Pourquoi |
|---|---|
| `src/services/notification-service/Myb.Notification/Security/CallerIdentity.cs` | Distingue un appel d'un service backend de confiance (claim `azp`) d'un appel d'utilisateur |
| `src/services/notification-service/Myb.Notification/Controllers/NotificationsController.cs` | Contrôles d'autorisation renforcés : chaque utilisateur n'agit que sur ses propres notifications, et seuls les services de confiance déclenchent un push |
| `src/services/notification-service/Myb.Notification/Controllers/PushController.cs` | Routes `/api/push/*` et validation des adresses d'abonnement |
| `src/services/notification-service/Myb.Notification/Services/PushDispatcher.cs` | File d'envoi en arrière-plan, nouveaux essais, suppression des abonnements expirés |
| `src/front/myb.front/libs/shared/infra/services/push-notification.service.ts` | Abonnement côté navigateur, désabonnement à la déconnexion |
| `src/front/myb.front/apps/client/src/service-worker.js` | Affichage de la notification et clic (liens internes uniquement) |

**Changement de comportement à valider :**
- Un appel à `POST /api/Notifications` fait avec un jeton utilisateur (cas des feuilles de temps) reste possible. En revanche, l'expéditeur est forcé à l'appelant et **aucun push** n'est envoyé.
- `POST /api/Notifications/email` est réservé aux services. Aucun écran ne l'utilise.

### A2. Faire passer « Run Tests » au vert (bloquant pour une CI verte)

Le job échoue de la même façon sur `main` : ces problèmes ne viennent pas de cette PR. Il y en a deux.

**1. `coproperty-management` : le projet de tests ne compile pas.** Le fichier `src/tests/unit-tests/coproperty-management/CopropertyManagement.Tests.csproj` provoque 84 erreurs CS0234/CS0246 :
- il cible `net7.0` alors que le service est en `net8.0` ;
- sa `ProjectReference` pointe vers `../../services/...`, qui se résout sous `src/tests/services/` (dossier inexistant), au lieu de `../../../services/...`.

À faire :
- corriger la cible et le chemin ;
- adapter les tests aux API actuelles du service, **sans changer le comportement du service**.

**2. `coproperty-payment` : un test échoue sur 31.** Il s'agit de `RequestedFixesTests.ApprovedPaymentEmail_IsEntirelyEnglishForEnglishOwner`.
- Le commit récent sur `main` a ajouté le nom de la copropriété dans l'objet des e-mails de paiement (`FundCallService`).
  - Objet attendu par le test : `[MYB] Payment approved – Call for funds`.
  - Objet obtenu : `… Payment approved – Residence – Appel de fonds`.
- Ce test révèle aussi un vrai petit défaut : pour un copropriétaire anglophone, la description par défaut reste en français (« Appel de fonds »).
- À faire :
  - mettre à jour l'objet attendu dans le test ;
  - corriger la description par défaut pour qu'elle suive la langue du copropriétaire (« Call for funds » en anglais).

**Terminé quand :** `dotnet test` passe sur les deux projets et le job « Run Tests » de la PR est vert. Si un autre test révèle un vrai bug du service, le signaler à part au lieu de l'effacer dans le test.

### A3. Tester sur de vrais appareils

Démarrer l'environnement local, puis suivre [PUSH_NOTIFICATIONS_LOCAL_TEST.md](PUSH_NOTIFICATIONS_LOCAL_TEST.md) :

```bash
bash scripts/push-local.sh up
```

Ensuite, envoyer une notification de test :

```bash
bash scripts/push-local.sh send owner "Test"
```

| Cas | Attendu |
|---|---|
| Chrome / Edge Windows, MYB en arrière-plan | notification système affichée |
| Clic sur la notification | MYB s'ouvre sur la bonne page |
| MYB ouvert au premier plan | seulement le toast, pas de doublon |
| Déconnexion puis nouvel envoi | rien n'arrive sur l'appareil |
| Android (Chrome) | notification reçue, application fermée |
| iPhone (iOS 16.4 ou plus), MYB **installé sur l'écran d'accueil** | notification reçue |

Les tests sur téléphone demandent un accès HTTPS, car `localhost` ne fonctionne que sur le poste lui-même. Le plus simple est de les faire sur l'environnement **hprd** une fois la partie B faite.

### A4. Améliorations repérées (hors PR, à planifier)

- Envoyer aussi en push les **rappels d'échéance** des appels de fonds : `FundCallReminderService` n'envoie aujourd'hui que des e-mails.
- Le message envoyé à la création d'un appel de fonds dit « … a été mis à jour » au lieu de « Nouvel appel de fonds » (`FundCallService.NotifyOwnerOfCreatedFundCallAsync`).
- Corriger proprement deux problèmes de migrations `coproperty`, qui empêchent une base neuve de démarrer (le script local les contourne seulement en local) :
  - aucune migration ne crée la table `OwnerUnits` ;
  - la migration `20260601_AddPaymentValidation` n'a pas d'attribut `[Migration]`.

  ⚠️ En production, les colonnes concernées existent déjà : une correction naïve ferait échouer le déploiement.
- `SubscriptionService` (front) appelle `myb-payment` sans jeton, ce qui donne un 401 dans la console. Ce n'est pas bloquant.
- Traduire les notifications dans la langue de l'utilisateur (phase 2 de la spec).

---

## B. DevOps / Kubernetes

### B1. Secrets GitHub Actions (bloquant pour la CI de build)

Le workflow `.github/workflows/deploy-ovhcloud.yml` échoue avec `Username and password required`. Les secrets suivants sont à renseigner dans *Settings → Secrets and variables → Actions* :

| Secret | Usage |
|---|---|
| `DOCKER_REGISTRY` | adresse du registre d'images (Harbor) |
| `REGISTRY_USERNAME` | compte robot du registre, avec droit de push |
| `REGISTRY_PASSWORD` | mot de passe ou jeton de ce compte |
| `KUBE_CONFIG_STAGING`, `KUBE_CONFIG_PROD` | déjà utilisés par les jobs de déploiement, à vérifier |

**Recommandation.** Le workflow tourne aussi sur les `pull_request` avec `push: true` : chaque PR publierait des images dans le registre. Il vaut mieux construire sans pousser sur les PR :

```yaml
push: ${{ github.event_name != 'pull_request' }}
```

### B2. Clés VAPID par environnement

Générer **une paire par environnement**, une pour `myb-hprd` et une pour `myb-prd`, et la conserver dans le coffre de l'équipe :

```bash
npx web-push generate-vapid-keys
```

Créer ensuite le secret dans chaque namespace. Le modèle se trouve dans `ovhcloud/k8s/secrets/push-vapid-secrets.yaml` ; comme les autres secrets, il n'est pas géré par kustomize.

```bash
kubectl -n myb-hprd create secret generic push-vapid \
  --from-literal=PUSH_VAPID_PUBLIC_KEY='<clé publique>' \
  --from-literal=PUSH_VAPID_PRIVATE_KEY='<clé privée>'
```

Faire de même avec `-n myb-prd` et la paire de prod.

⚠️ **Ne jamais changer la clé privée d'un environnement** une fois en service : tous les appareils abonnés cesseraient de recevoir les notifications, et chacun devrait réactiver le push.

`ovhcloud/k8s/services/notification/deployment.yaml` lit déjà ce secret, avec `optional: true` : sans le secret, le pod démarre avec le push désactivé. `Push__Subject` vaut `mailto:support@myb-platform.com`.

### B3. Configuration déjà en place (à vérifier)

- `NotificationSecurity__TrustedServiceClients__0` est lu dans la ConfigMap `app-config`, clé `KEYCLOAK_SERVICE_CLIENT_ID` (`myb-backend`). Il doit correspondre au client de service utilisé par `myb-coproperty` (`Keycloak__ServiceClientId`). Si les deux divergent, les notifications envoyées par le backend seront refusées (403).
- **Helm** : `ovhcloud/helm/myb-platform/values.yaml` ne contient pas encore les variables `Push__*` ni `NotificationSecurity__*`. Si le déploiement passe par Helm plutôt que par les manifestes kustomize, il faut les ajouter au chart.
- **Render** (`render.yaml`) : `Push__VapidPublicKey` et `Push__VapidPrivateKey` sont déclarés en `sync: false`, à renseigner dans l'interface Render si cet hébergement est utilisé.

### B4. Réseau sortant

Le pod `myb-notification` doit pouvoir appeler en **HTTPS (443)** les services push des navigateurs. Si des NetworkPolicies ou un proxy filtrent la sortie, il faut autoriser :

- `fcm.googleapis.com` (Chrome, Edge, Android)
- `*.push.services.mozilla.com` (Firefox)
- `*.push.apple.com` (Safari, iOS)
- `*.notify.windows.com` (ancien Edge)

### B5. Vérifier après déploiement

1. Logs du pod : le message `Web Push disabled` ne doit **pas** apparaître. Il signale un secret absent ou vide.

   ```bash
   kubectl -n <ns> logs deploy/myb-notification
   ```
2. Dans l'app, *Mon profil → Notifications push → Activer* : une notification « Notifications activées ✅ » arrive.
3. La table `PushSubscriptions` se crée toute seule dans la base de notifications au démarrage. C'est une création idempotente : rien n'est modifié dans les tables existantes.

**Retour arrière.** Supprimer le secret `push-vapid` et redémarrer le pod désactive le push. Le reste de l'application n'est pas impacté.

---

## Checklist pour fermer la PR

| # | Action | Rôle | Bloquant fusion |
|---|---|---|---|
| 1 | Revue de code (A1) | Développeur | recommandé |
| 2 | Réparer les tests `coproperty-management` et `coproperty-payment` (A2) | Développeur | pour une CI verte |
| 3 | Secrets GitHub du registre (B1) | DevOps | pour une CI verte |
| 4 | Fusionner la PR | Développeur, après 1 à 3 | — |
| 5 | Clés VAPID et secret `push-vapid` en hprd puis prd (B2) | DevOps | non, mais requis pour le push |
| 6 | Vérifications réseau et Helm (B3, B4) | DevOps | non |
| 7 | Tests sur appareils réels en hprd (A3, B5) | Développeur et DevOps | avant d'annoncer la fonctionnalité |
