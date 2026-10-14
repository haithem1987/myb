# Lancer MYB en local avec Docker

Une seule commande lance toute l'application dans Docker : backend, les deux fronts, Keycloak et des données de démo. Il ne reste plus qu'à ouvrir les pages.

## Démarrer

```bash
bash scripts/push-local.sh up
```

La commande compile les fronts, ce qui prend environ 2 minutes. Pour réutiliser la dernière compilation :

```bash
SKIP_FRONT_BUILD=1 bash scripts/push-local.sh up
```

| Page | URL | Compte |
|---|---|---|
| Espace copropriétaire (app client) | http://localhost:4200 | `owner@myb-test.com` / `owner123` |
| Espace syndic (app admin) | http://localhost:4201 | `syndic@myb-test.com` / `syndic123` |
| Console Keycloak | http://localhost:8080/admin | `admin` / `admin` |
| E-mails envoyés (MailHog) | http://localhost:8025 | — |
| RabbitMQ | http://localhost:15672 | `guest` / `guest` |

**Données de démo.** La **Residence Ellyssa** a 8 lots, 6 copropriétaires et des lignes budgétaires. Elle est gérée par le syndic de test. Le copropriétaire de test possède le lot A1.

Arrêter, sans perdre les données :

```bash
bash scripts/push-local.sh down
```

Repartir de zéro : arrêter, puis supprimer les volumes Docker du projet (`docker volume ls`). **Toutes les données locales sont alors perdues.**

## Ce qui tourne

**Backend** (`docker-compose.yml`) :

| Service | Port |
|---|---|
| keycloak | 8080 |
| myb-coproperty | 8088 |
| myb-notification | 8085 |
| myb-payment | 8084 |
| myb-invoice | 8083 |
| myb-timesheet | 8082 |
| myb-docmanager | 8086 |
| myb-usermanager | 8087 |
| myb-mailer | 8089 |
| rabbitmq | 5672 |
| mailhog | 8025 |

Les bases PostgreSQL de chaque service tournent aussi dans Docker.

**Ajouts locaux** (`docker-compose.local.yml`, jamais utilisé en production) :
- `paymentDB` : `myb-payment` n'a pas de base dans `docker-compose.yml` et plantait au démarrage.
- `myb-client-local` (port 4200) et `myb-admin-local` (port 4201) : deux nginx qui servent les fronts compilés en configuration `pushdev`, c'est-à-dire les URLs `localhost` avec le service worker activé.
  - En production, l'espace syndic est servi sous `/admin/`. En local, nginx redirige les liens `/admin/...` (e-mails, notifications push) vers le port 4201.

**Corrections de schéma appliquées par le script** (base locale uniquement) :
- Il crée la table `OwnerUnits` avec `scripts/create-owner-units-table.sql`, car aucune migration EF ne la crée.
- Il ajoute les colonnes `ValidationStatus` et `RejectionReason` à `FundCallPayments`. La migration `20260601_AddPaymentValidation` n'a pas d'attribut `[Migration]`, donc EF ne l'applique jamais.

## Variantes

- **Notifications push** : voir [PUSH_NOTIFICATIONS_LOCAL_TEST.md](PUSH_NOTIFICATIONS_LOCAL_TEST.md).
- **Déboguer `notification` et `coproperty`** : lancer `bash scripts/push-local.sh up --debug`, voir [DEBUG_DOCKER_LOCAL.md](DEBUG_DOCKER_LOCAL.md).
- **Modifier le front avec rechargement à chaud** : arrêter `myb-client-local` et `myb-admin-local`, puis lancer `npx nx serve client --configuration=pushdev` (ou `admin`) depuis `src/front/myb.front`.

## Problèmes connus

- **Erreur 401 sur `localhost:8084/api/payment/subscriptions/...` dans la console.** `SubscriptionService` appelle `myb-payment` sans jeton d'authentification. Le bug existe aussi en production et ne bloque pas les pages.
- **Modification du backend** : relancer `bash scripts/push-local.sh up` pour reconstruire les images.
