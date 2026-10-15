# Tester les notifications push en local

Le backend tourne dans Docker et le front avec `nx serve`. `http://localhost` est un contexte sécurisé : les navigateurs y autorisent le Web Push sans HTTPS. Les messages passent par les vrais services push gratuits des navigateurs (FCM pour Chrome et Edge), il faut donc un accès Internet.

## 1. Démarrer le backend

```bash
bash scripts/push-local.sh up
```

Le script est idempotent, on peut le relancer sans risque. Il :
- génère des clés VAPID **locales** dans `.env.push.local`, un fichier ignoré par git ;
- construit et démarre Keycloak, RabbitMQ, MailHog, PostgreSQL, `myb-notification`, `myb-coproperty` et `myb-mailer` ;
- configure Keycloak avec `scripts/push-local-keycloak.py` : realm `MYB`, client `MYB-client`, client de service `myb-backend` (avec le secret attendu par `docker-compose.yml`) et deux comptes de test ;
- crée la table `OwnerUnits` sur une base `coproperty` neuve, car aucune migration EF ne la crée.

| Compte | Mot de passe | Espace |
|---|---|---|
| `owner@myb-test.com` | `owner123` | copropriétaire, app client |
| `syndic@myb-test.com` | `syndic123` | syndic, app admin |

## 2. Ouvrir l'application

`up` lance aussi les deux fronts dans Docker (voir [LOCAL_DOCKER_STACK.md](LOCAL_DOCKER_STACK.md)) :

- espace copropriétaire : http://localhost:4200
- espace syndic : http://localhost:4201

Ce sont les builds `pushdev`, c'est-à-dire la configuration de développement avec `pwaInDev: true` pour activer le service worker. Pour travailler sur le front avec rechargement à chaud, arrêter les conteneurs `myb-client-local` et `myb-admin-local`, puis lancer `npx nx serve client --configuration=pushdev` (ou `admin`) depuis `src/front/myb.front`.

## 3. Tester

1. Ouvrir http://localhost:4200, puis se connecter avec `owner@myb-test.com` / `owner123`.
2. Aller dans **Mon profil**, section **Notifications push**, cliquer sur **Activer les notifications** et accepter la demande du navigateur.
   - Une notification de test « Notifications activées ✅ » est envoyée. Si l'onglet MYB est au premier plan, elle n'apparaît pas : le toast de l'app suffit.
3. Mettre MYB en arrière-plan : changer d'onglet, réduire la fenêtre ou fermer l'onglet. Puis envoyer une notification exactement comme le backend :

   ```bash
   bash scripts/push-local.sh send owner "Votre paiement a été validé." "/coproperty/select?space=owner"
   ```

   La notification système Windows apparaît. Un clic dessus ouvre MYB sur la page indiquée.
4. Pour tester le syndic, faire la même chose sur http://localhost:4201 avec `syndic@myb-test.com`, puis :

   ```bash
   bash scripts/push-local.sh send syndic "Paiement reçu"
   ```

Pour tester un vrai événement métier (appel de fonds, validation de paiement), il faut créer une copropriété, un lot et un copropriétaire depuis l'espace syndic.

## Vérifier côté serveur

Lister les appareils abonnés :

```bash
docker exec myb-notificationDB-1 psql -U postgres -d notificationDB -c 'select "UserId", left("Endpoint", 45), "FailureCount", "LastSuccessAt" from "PushSubscriptions"'
```

Suivre les envois vers FCM :

```bash
docker logs -f myb-myb-notification-1
```

- `LastSuccessAt` renseigné : le service push a accepté le message.
- Aucun appareil listé : l'abonnement n'est pas parvenu jusqu'au serveur.

## Pièges connus

- **Windows : aucune notification ne s'affiche.** Vérifier dans *Paramètres → Système → Notifications* que les notifications de Chrome ou d'Edge sont autorisées et que le mode « Ne pas déranger » est désactivé.
- **Notifications bloquées dans le navigateur.** Si on a refusé une fois, réautoriser via l'icône à gauche de la barre d'adresse, puis *Notifications*.
- **Liens syndic.** Les notifications syndic pointent vers `/admin/...`, comme en production. Avec la stack Docker, nginx les redirige vers http://localhost:4201. Avec `nx serve admin`, ces liens ne trouvent pas la page.
- **Arrêter le backend :**

  ```bash
  bash scripts/push-local.sh down
  ```
